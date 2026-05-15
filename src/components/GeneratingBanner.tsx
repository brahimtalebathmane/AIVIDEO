"use client";

import { motion } from "framer-motion";
import { Loader2, Square } from "lucide-react";
import { useEffect, useState } from "react";
import type { VideoTask } from "@/lib/types";
import { QUALITY_PRESETS } from "@/lib/types";

interface GeneratingBannerProps {
  active: boolean;
  pendingTasks: VideoTask[];
  onCancelAll: () => Promise<void>;
}

export function GeneratingBanner({
  active,
  pendingTasks,
  onCancelAll,
}: GeneratingBannerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const time =
    minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const usesFast = pendingTasks.some((t) => QUALITY_PRESETS[t.preset]?.tier === "fast");
  const etaHint = usesFast
    ? "Fast preset · typically 1–3 minutes"
    : "Quality preset · typically 2–5 minutes";

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await onCancelAll();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3"
    >
      <motion.div className="flex flex-wrap items-center justify-between gap-4">
        <motion.div className="flex min-w-0 flex-1 items-center gap-3">
          <motion.div
            className="h-2 w-2 shrink-0 rounded-full bg-violet-400"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-violet-200">
              Generating {pendingTasks.length > 1 ? `${pendingTasks.length} videos` : "your video"}…
            </p>
            <p className="text-xs text-violet-300/70">
              {etaHint} · {time} elapsed · smooth motion & cinematic lighting
            </p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          <motion.div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-violet-950 sm:block">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{ width: "50%" }}
            />
          </motion.div>
          <button
            type="button"
            disabled={cancelling}
            onClick={handleCancel}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            {cancelling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Square className="h-3.5 w-3.5 fill-current" />
            )}
            Stop all
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
