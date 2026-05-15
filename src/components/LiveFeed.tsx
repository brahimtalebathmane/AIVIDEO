"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Loader2, Square } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { imageSizeLabel } from "@/lib/production";
import type { VideoTask } from "@/lib/types";
import { QUALITY_PRESETS } from "@/lib/types";

interface LiveFeedProps {
  tasks: VideoTask[];
  onCancelTask?: (taskId: string) => Promise<void>;
}

const ACTIVE = ["generating", "downloading", "queued"] as const;

export function LiveFeed({ tasks, onCancelTask }: LiveFeedProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const recent = tasks.slice(0, 8);

  const handleCancel = async (taskId: string) => {
    if (!onCancelTask) return;
    setCancellingId(taskId);
    try {
      await onCancelTask(taskId);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-2xl p-6"
    >
      <motion.div className="mb-4 flex items-center justify-between">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4 text-emerald-400" />
          <h2 className="text-lg font-semibold">Live Feed</h2>
        </motion.div>
        <span className="text-xs text-zinc-500">
          {tasks.filter((t) => ACTIVE.includes(t.status as (typeof ACTIVE)[number])).length}{" "}
          active
        </span>
      </motion.div>

      <motion.div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {recent.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center text-sm text-zinc-600"
            >
              No tasks yet. Generate your first video!
            </motion.p>
          ) : (
            recent.map((task) => {
              const isActive = ACTIVE.includes(
                task.status as (typeof ACTIVE)[number]
              );
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <motion.div className="mb-1 flex flex-wrap items-center gap-1.5">
                    {(task.mode === "production" || task.mode === "i2v") && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                        {task.mode === "production" ? "SEQ" : "I2V"}
                      </span>
                    )}
                      {task.shotLabel && (
                        <span className="text-xs font-semibold text-violet-400">
                          {task.shotLabel}
                        </span>
                      )}
                      {task.sequenceName && (
                        <span className="truncate text-[10px] text-zinc-600">
                          {task.sequenceName}
                        </span>
                      )}
                    </motion.div>
                    <p className="truncate text-sm text-zinc-300">{task.prompt}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {QUALITY_PRESETS[task.preset].label} ·{" "}
                      {imageSizeLabel(task.imageSize)} ·{" "}
                      {new Date(task.createdAt).toLocaleTimeString()}
                    </p>
                    {task.error && (
                      <p className="mt-1 text-xs text-red-400">{task.error}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={task.status} />
                    {isActive && onCancelTask && (
                      <button
                        type="button"
                        disabled={cancellingId === task.id}
                        onClick={() => handleCancel(task.id)}
                        className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                        title="Stop generation and free GPU queue"
                      >
                        {cancellingId === task.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Square className="h-3 w-3 fill-current" />
                        )}
                        Stop
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
}
