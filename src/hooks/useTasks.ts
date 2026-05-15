"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadClientTasks,
  mergeTasks,
  saveClientTasks,
} from "@/lib/client-storage";
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

  const generate = useCallback(
    async (prompt: string, preset: QualityPreset) => {
      setGenerating(true);
      setError(null);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, preset }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Generation failed");

        const next = [data.task as VideoTask, ...tasksRef.current];
        setTasks(next);
        saveClientTasks(next);
        setGenerating(false);

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
    [pollTasks]
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
    refresh: fetchTasks,
  };
}
