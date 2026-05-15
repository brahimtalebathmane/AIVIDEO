"use client";

import { motion } from "framer-motion";
import { Clock, Film, Loader2, Sparkles } from "lucide-react";
import type { VideoTask } from "@/lib/types";

interface StatsBarProps {
  tasks: VideoTask[];
  generating: boolean;
}

export function StatsBar({ tasks, generating }: StatsBarProps) {
  const ready = tasks.filter((t) => t.status === "ready").length;
  const active = tasks.filter((t) =>
    ["queued", "generating", "downloading"].includes(t.status)
  ).length;
  const failed = tasks.filter((t) => t.status === "failed").length;

  const stats = [
    {
      label: "Videos ready",
      value: ready,
      icon: Film,
      color: "text-emerald-400",
    },
    {
      label: "In progress",
      value: active,
      icon: generating ? Loader2 : Sparkles,
      color: "text-violet-400",
      spin: generating || active > 0,
    },
    {
      label: "Total jobs",
      value: tasks.length,
      icon: Clock,
      color: "text-cyan-400",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-3"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <stat.icon
              className={`h-4 w-4 ${stat.color} ${stat.spin ? "animate-spin" : ""}`}
            />
            <span className="text-xs text-zinc-500">{stat.label}</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-100">
            {stat.value}
          </p>
          {stat.label === "Videos ready" && failed > 0 && (
            <p className="mt-0.5 text-xs text-red-400/80">{failed} failed</p>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
