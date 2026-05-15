"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadClientTasks,
  mergeTasks,
  saveClientTasks,
} from "@/lib/client-storage";
import type { ProductionBible, ImageSize } from "@/lib/production";
import type { QualityPreset, VideoTask } from "@/lib/types";

const POLL_INTERVAL = 4000;

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
    const hasPending = current.some((t) =>
      ["queued", "generating", "downloading"].includes(t.status)
    );
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
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      return data.task as VideoTask;
    },
    []
  );

  const generate = useCallback(
    async (prompt: string, preset: QualityPreset) => {
      setGenerating(true);
      setError(null);
      try {
        const task = await postGenerate({ prompt, preset, mode: "t2v" });
        const next = [task, ...tasksRef.current];
        tasksRef.current = next;
        setTasks(next);
        saveClientTasks(next);
        pollTasks();
        return { success: true as const };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        setError(message);
        return { success: false as const, error: message };
      } finally {
        setGenerating(false);
      }
    },
    [pollTasks, postGenerate]
  );

  const generateProductionShot = useCallback(
    async (payload: ProductionGeneratePayload) => {
      setGenerating(true);
      setError(null);
      try {
        const task = await postGenerate({
          mode: "i2v",
          preset: payload.preset ?? "cinematic",
          referenceImage: payload.referenceImage,
          imageSize: payload.imageSize,
          bible: payload.bible,
          shotAction: payload.shotAction,
          shotLabel: payload.shotLabel,
          sequenceName: payload.sequenceName,
          ...(payload.seed != null ? { seed: payload.seed } : {}),
        });
        const next = [task, ...tasksRef.current];
        tasksRef.current = next;
        setTasks(next);
        saveClientTasks(next);
        pollTasks();
        return { success: true as const };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        setError(message);
        return { success: false as const, error: message };
      } finally {
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
      let success = 0;
      let failed = 0;
      let lastError: string | undefined;

      for (let i = 0; i < payloads.length; i++) {
        onProgress?.(i, payloads.length);
        try {
          const task = await postGenerate({
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
          });
          tasksRef.current = [task, ...tasksRef.current];
          success++;
          await new Promise((r) => setTimeout(r, 1000));
        } catch (err) {
          failed++;
          lastError =
            err instanceof Error ? err.message : "Generation failed";
        }
      }

      onProgress?.(payloads.length, payloads.length);
      setTasks([...tasksRef.current]);
      saveClientTasks(tasksRef.current);
      setGenerating(false);
      pollTasks();

      if (lastError && success === 0) setError(lastError);

      return { success, failed, error: lastError };
    },
    [pollTasks, postGenerate]
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

  useEffect(() => {
    const id = setInterval(pollTasks, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [pollTasks]);

  const hasPending = tasks.some((t) =>
    ["queued", "generating", "downloading"].includes(t.status)
  );

  useEffect(() => {
    if (hasPending) pollTasks();
  }, [hasPending, pollTasks]);

  return {
    tasks,
    readyVideos,
    loading,
    generating,
    hasPending,
    error,
    setError,
    generate,
    generateProductionShot,
    generateProductionSequence,
    refresh: fetchTasks,
  };
}
