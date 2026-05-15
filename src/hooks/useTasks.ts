"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QualityPreset, VideoTask } from "@/lib/types";

const POLL_INTERVAL = 4000;

export function useTasks() {
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [readyVideos, setReadyVideos] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setReadyVideos(data.ready ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const pollTasks = useCallback(async () => {
    const hasPending = tasks.some((t) =>
      ["queued", "generating", "downloading"].includes(t.status)
    );
    if (!hasPending && tasks.length > 0) return;

    try {
      const res = await fetch("/api/tasks/poll", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setReadyVideos(data.ready ?? []);
    } catch {
      /* silent poll failure */
    }
  }, [tasks]);

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

        setTasks((prev) => [data.task, ...prev]);
        await fetch("/api/tasks/poll", { method: "POST" }).then(async (r) => {
          if (r.ok) {
            const polled = await r.json();
            setTasks(polled.tasks ?? []);
            setReadyVideos(polled.ready ?? []);
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
        throw err;
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      pollTasks();
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollTasks]);

  const hasPending = tasks.some((t) =>
    ["queued", "generating", "downloading"].includes(t.status)
  );

  useEffect(() => {
    if (hasPending) {
      pollTasks();
    }
  }, [hasPending, pollTasks]);

  return {
    tasks,
    readyVideos,
    loading,
    generating,
    error,
    generate,
    refresh: fetchTasks,
  };
}
