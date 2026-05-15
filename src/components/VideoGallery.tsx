"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Film, Play } from "lucide-react";
import { useRef, useState } from "react";
import type { VideoTask } from "@/lib/types";
import { QUALITY_PRESETS } from "@/lib/types";

interface VideoGalleryProps {
  videos: VideoTask[];
}

function VideoCard({ task }: { task: VideoTask }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  const handleMouseEnter = () => {
    setHovering(true);
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleDownload = () => {
    if (!task.videoUrl) return;
    const a = document.createElement("a");
    a.href = task.videoUrl;
    a.download = `nexus-video-${task.id.slice(0, 8)}.mp4`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group glass overflow-hidden rounded-2xl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video bg-black/50">
        {task.videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={task.videoUrl}
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
            <motion.div
              initial={false}
              animate={{ opacity: hovering ? 0 : 1 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40"
            >
              <motion.div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">
                <Play className="h-6 w-6 fill-white text-white" />
              </motion.div>
            </motion.div>
          </>
        ) : (
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex h-full items-center justify-center"
          >
            <Film className="h-10 w-10 text-zinc-700" />
          </motion.div>
        )}
      </div>

      <div className="p-4">
        <motion.div className="mb-1 flex flex-wrap items-center gap-1.5">
          {(task.mode === "production" || task.mode === "i2v") && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300">
              {task.mode === "production" ? "SEQ" : "I2V"}
            </span>
          )}
          {task.shotLabel && (
            <span className="text-xs font-semibold text-violet-400">
              {task.shotLabel}
            </span>
          )}
        </motion.div>
        <p className="line-clamp-2 text-sm text-zinc-300">{task.prompt}</p>
        <motion.div
          className="mt-3 flex items-center justify-between"
          initial={false}
        >
          <span className="text-xs text-zinc-600">
            {QUALITY_PRESETS[task.preset].label}
          </span>
          {task.videoUrl && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-300 ring-1 ring-violet-500/30 transition-colors hover:bg-violet-500/30"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.article>
  );
}

export function VideoGallery({ videos }: VideoGalleryProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-2xl p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Video Gallery</h2>
        <span className="text-xs text-zinc-500">{videos.length} clips</span>
      </div>

      <AnimatePresence mode="popLayout">
        {videos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-center"
          >
            <Film className="mb-4 h-12 w-12 text-zinc-700" />
            <p className="text-sm text-zinc-500">Your generated videos will appear here</p>
            <p className="mt-1 text-xs text-zinc-600">
              Hover to preview · Click download to save
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {videos.map((task) => (
              <VideoCard key={task.id} task={task} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
