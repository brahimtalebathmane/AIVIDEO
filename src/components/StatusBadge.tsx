"use client";

import type { TaskStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; emoji: string; className: string }
> = {
  queued: {
    label: "Queued",
    emoji: "⏳",
    className: "bg-zinc-500/20 text-zinc-400 ring-zinc-500/30",
  },
  generating: {
    label: "Generating",
    emoji: "⏳",
    className: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  },
  downloading: {
    label: "Downloading",
    emoji: "📥",
    className: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
  },
  ready: {
    label: "Ready",
    emoji: "✅",
    className: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
  },
  failed: {
    label: "Failed",
    emoji: "❌",
    className: "bg-red-500/20 text-red-300 ring-red-500/30",
  },
  cancelled: {
    label: "Cancelled",
    emoji: "⏹",
    className: "bg-zinc-500/20 text-zinc-400 ring-zinc-500/30",
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${config.className}`}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}
