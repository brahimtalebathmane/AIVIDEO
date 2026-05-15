"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface GeneratingBannerProps {
  active: boolean;
}

export function GeneratingBanner({ active }: GeneratingBannerProps) {
  const [elapsed, setElapsed] = useState(0);

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
    minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3"
    >
      <motion.div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="h-2 w-2 rounded-full bg-violet-400"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          <div>
            <p className="text-sm font-medium text-violet-200">
              Generating your video…
            </p>
            <p className="text-xs text-violet-300/70">
              Wan2.1 typically takes 2–5 minutes · {time} elapsed
            </p>
          </div>
        </div>
        <motion.div
          className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-violet-950 sm:block"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{ width: "50%" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
