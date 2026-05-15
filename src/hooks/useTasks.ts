"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadClientTasks,
  mergeTasks,
  saveClientTasks,
} from "@/lib/client-storage";
import type { ImageSize, ProductionBible } from "@/lib/production";
import type { QualityPreset, VideoTask } from "@/lib/types";

const POLL_INTERVAL_IDLE = 6000;
const POLL_INTERVAL_ACTIVE = 2500;

const PENDING_STATUSES = ["queued", "generating", "downloading"] as const;

function isPending(status: VideoTask["status"]): boolean {
  return (PENDING_STATUSES as readonly string[]).includes(status);
}

function applyTasks(
  serverTasks: VideoTask[],
  setTasks: (t: VideoTask[]) => void,
  setReadyVideos: (t: VideoTask[]) => void
) {
  const client = loadClientTasks();
  const merged = mergeTasks(serverTasks, client);
  setTasks(merged);
  setReadyVideos(merged.filter((t) => t.status === "ready" && t.videoUrl));
  saveClientTasks(merged);
}

export interface ProductionGeneratePayload {
  referenceImage: string;
  imageSize: ImageSize;
  bible: ProductionBible;
  shotAction: string;
  shotLabel: string;
  sequenceName: string;
  seed?: number | null;
  preset?: QualityPreset;
}

export function useTasks() {
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [readyVideos, setReadyVideos] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tasksRef = useRef<VideoTask[]>([]);
  const sequenceAbortRef = useRef(false);
  const submitAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      applyTasks(data.tasks ?? [], setTasks, setReadyVideos);
      setError(null);
    } catch (err) {
      const cached = loadClientTasks();
      if (cached.length > 0) {
        setTasks(cached);
        setReadyVideos(
          cached.filter((t) => t.status === "ready" && t.videoUrl)
        );
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const pollTasks = useCallback(async () => {
    const current = tasksRef.current;
    const hasPending = current.some((t) => isPending(t.status));
    if (!hasPending) return;

    try {
      const res = await fetch("/api/tasks/poll", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      applyTasks(data.tasks ?? [], setTasks, setReadyVideos);
    } catch {
      /* silent */
    }
  }, []);

  const postGenerate = useCallback(
    async (body: Record<string, unknown>, signal?: AbortSignal) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      return data.task as VideoTask;
    },
    []
  );

  const applyCancelledLocally = useCallback((taskId: string): VideoTask[] => {
    const now = new Date().toISOString();
    const next = tasksRef.current.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: "cancelled" as const,
            error: undefined,
            siliconStatus: "Cancelled",
            updatedAt: now,
          }
        : t
    );
    tasksRef.current = next;
    setTasks(next);
    saveClientTasks(next);
    setReadyVideos(next.filter((t) => t.status === "ready" && t.videoUrl));
    return next;
  }, []);

  const cancelTask = useCallback(
    async (taskId: string) => {
      setGenerating(false);
      applyCancelledLocally(taskId);

      try {
        const res = await fetch(`/api/tasks/${taskId}/cancel`, {
          method: "POST",
        });
        const data = await res.json();
        if (res.ok && data.task) {
          const updated = data.task as VideoTask;
          const next = tasksRef.current.map((t) =>
            t.id === taskId ? updated : t
          );
          tasksRef.current = next;
          setTasks(next);
          saveClientTasks(next);
          return updated;
        }
      } catch {
        /* keep optimistic cancel */
      }

      return (
        tasksRef.current.find((t) => t.id === taskId) ?? {
          id: taskId,
          status: "cancelled",
        }
      ) as VideoTask;
    },
    [applyCancelledLocally]
  );

  const stopAllGeneration = useCallback(async () => {
    submitAbortRef.current?.abort();
    sequenceAbortRef.current = true;
    setGenerating(false);

    const pending = tasksRef.current.filter((t) => isPending(t.status));
    const now = new Date().toISOString();

    if (pending.length > 0) {
      const next = tasksRef.current.map((t) =>
        isPending(t.status)
          ? {
              ...t,
              status: "cancelled" as const,
              error: undefined,
              siliconStatus: "Cancelled",
              updatedAt: now,
            }
          : t
      );
      tasksRef.current = next;
      setTasks(next);
      saveClientTasks(next);
    }

    await Promise.allSettled(
      pending.map((t) =>
        fetch(`/api/tasks/${t.id}/cancel`, { method: "POST" })
      )
    );

    pollTasks();
  }, [pollTasks]);

  const cancelSequence = useCallback(() => {
    sequenceAbortRef.current = true;
    submitAbortRef.current?.abort();
  }, []);

  const generate = useCallback(
    async (
      prompt: string,
      preset: QualityPreset,
      imageSize?: ImageSize
    ) => {
      setGenerating(true);
      setError(null);
      const controller = new AbortController();
      submitAbortRef.current = controller;
      try {
        const task = await postGenerate(
          {
            prompt,
            preset,
            mode: "t2v",
            ...(imageSize ? { imageSize } : {}),
          },
          controller.signal
        );
        const next = [task, ...tasksRef.current];
        tasksRef.current = next;
        setTasks(next);
        saveClientTasks(next);
        pollTasks();
        return { success: true as const };
      } catch (err) {
        if (controller.signal.aborted) {
          return { success: false as const, error: "Cancelled" };
        }
        const message =
          err instanceof Error ? err.message : "Generation failed";
        setError(message);
        return { success: false as const, error: message };
      } finally {
        submitAbortRef.current = null;
        setGenerating(false);
      }
    },
    [pollTasks, postGenerate]
  );

  const generateProductionShot = useCallback(
    async (payload: ProductionGeneratePayload) => {
      setGenerating(true);
      setError(null);
      const controller = new AbortController();
      submitAbortRef.current = controller;
      try {
        const task = await postGenerate(
          {
            mode: "i2v",
            preset: payload.preset ?? "cinematic",
            referenceImage: payload.referenceImage,
            imageSize: payload.imageSize,
            bible: payload.bible,
            shotAction: payload.shotAction,
            shotLabel: payload.shotLabel,
            sequenceName: payload.sequenceName,
            ...(payload.seed != null ? { seed: payload.seed } : {}),
          },
          controller.signal
        );
        const next = [task, ...tasksRef.current];
        tasksRef.current = next;
        setTasks(next);
        saveClientTasks(next);
        pollTasks();
        return { success: true as const };
      } catch (err) {
        if (controller.signal.aborted) {
          return { success: false as const, error: "Cancelled" };
        }
        const message =
          err instanceof Error ? err.message : "Generation failed";
        setError(message);
        return { success: false as const, error: message };
      } finally {
        submitAbortRef.current = null;
        setGenerating(false);
      }
    },
    [pollTasks, postGenerate]
  );

  const generateProductionSequence = useCallback(
    async (
      payloads: ProductionGeneratePayload[],
      onProgress?: (done: number, total: number) => void
    ) => {
      setGenerating(true);
      setError(null);
      sequenceAbortRef.current = false;
      let success = 0;
      let failed = 0;
      let cancelled = false;
      let lastError: string | undefined;

      for (let i = 0; i < payloads.length; i++) {
        if (sequenceAbortRef.current) {
          cancelled = true;
          break;
        }

        onProgress?.(i, payloads.length);
        const controller = new AbortController();
        submitAbortRef.current = controller;

        try {
          const task = await postGenerate(
            {
              mode: "i2v",
              preset: payloads[i].preset ?? "cinematic",
              referenceImage: payloads[i].referenceImage,
              imageSize: payloads[i].imageSize,
              bible: payloads[i].bible,
              shotAction: payloads[i].shotAction,
              shotLabel: payloads[i].shotLabel,
              sequenceName: payloads[i].sequenceName,
              ...(payloads[i].seed != null
                ? { seed: payloads[i].seed }
                : {}),
            },
            controller.signal
          );
          tasksRef.current = [task, ...tasksRef.current];
          success++;
          if (sequenceAbortRef.current) {
            cancelled = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 800));
        } catch (err) {
          if (controller.signal.aborted || sequenceAbortRef.current) {
            cancelled = true;
            break;
          }
          failed++;
          lastError =
            err instanceof Error ? err.message : "Generation failed";
        } finally {
          submitAbortRef.current = null;
        }
      }

      if (cancelled) {
        const pending = tasksRef.current.filter((t) => isPending(t.status));
        await Promise.allSettled(pending.map((t) => cancelTask(t.id)));
      }

      onProgress?.(payloads.length, payloads.length);
      setTasks([...tasksRef.current]);
      saveClientTasks(tasksRef.current);
      setGenerating(false);
      sequenceAbortRef.current = false;
      pollTasks();

      if (lastError && success === 0 && !cancelled) setError(lastError);

      return { success, failed, cancelled, error: lastError };
    },
    [cancelTask, pollTasks, postGenerate]
  );

  useEffect(() => {
    const cached = loadClientTasks();
    if (cached.length > 0) {
      setTasks(cached);
      setReadyVideos(
        cached.filter((t) => t.status === "ready" && t.videoUrl)
      );
    }
    fetchTasks();
  }, [fetchTasks]);

  const hasPending = tasks.some((t) => isPending(t.status));
  const pendingTasks = tasks.filter((t) => isPending(t.status));

  useEffect(() => {
    const interval = hasPending ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE;
    const id = setInterval(pollTasks, interval);
    return () => clearInterval(id);
  }, [hasPending, pollTasks]);

  useEffect(() => {
    if (hasPending) pollTasks();
  }, [hasPending, pollTasks]);

  return {
    tasks,
    readyVideos,
    pendingTasks,
    loading,
    generating,
    hasPending,
    error,
    setError,
    generate,
    generateProductionShot,
    generateProductionSequence,
    cancelTask,
    stopAllGeneration,
    cancelSequence,
    refresh: fetchTasks,
  };
}
