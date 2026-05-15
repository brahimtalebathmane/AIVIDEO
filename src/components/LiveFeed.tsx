"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { VideoTask } from "@/lib/types";
import { QUALITY_PRESETS } from "@/lib/types";

interface LiveFeedProps {
  tasks: VideoTask[];
}

export function LiveFeed({ tasks }: LiveFeedProps) {
  const recent = tasks.slice(0, 8);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-2xl p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4 text-emerald-400" />
          <h2 className="text-lg font-semibold">Live Feed</h2>
        </motion.div>
        <span className="text-xs text-zinc-500">
          {tasks.filter((t) =>
            ["generating", "downloading", "queued"].includes(t.status)
          ).length}{" "}
          active
        </span>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
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
            recent.map((task) => (
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
                    {task.mode === "i2v" && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                        I2V
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
                    {new Date(task.createdAt).toLocaleTimeString()}
                  </p>
                  {task.error && (
                    <p className="mt-1 text-xs text-red-400">{task.error}</p>
                  )}
                </div>
                <StatusBadge status={task.status} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
