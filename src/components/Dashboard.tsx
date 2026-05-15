"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, RefreshCw, Video, X } from "lucide-react";
import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { GeneratingBanner } from "./GeneratingBanner";
import { PromptStudio } from "./PromptStudio";
import { LiveFeed } from "./LiveFeed";
import { Sidebar } from "./Sidebar";
import { StatsBar } from "./StatsBar";
import { useToast } from "./Toast";
import { VideoGallery } from "./VideoGallery";

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const {
    tasks,
    readyVideos,
    loading,
    generating,
    hasPending,
    error,
    setError,
    generate,
    generateAll,
    refresh,
  } = useTasks();

  const handleGenerate = async (
    prompt: string,
    preset: Parameters<typeof generate>[1],
    sceneLabel?: string
  ) => {
    const result = await generate(prompt, preset, sceneLabel);
    if (result.success) {
      toast(
        sceneLabel
          ? `${sceneLabel} queued — usually ready in 2–5 minutes`
          : "Video job queued — usually ready in 2–5 minutes",
        "success"
      );
    } else {
      toast(result.error ?? "Generation failed", "error");
    }
    return result;
  };

  const handleGenerateAll = async (
    items: { prompt: string; sceneLabel: string }[],
    preset: Parameters<typeof generateAll>[1]
  ) => {
    const result = await generateAll(items, preset);
    if (result.success > 0) {
      toast(
        `${result.success} scene${result.success > 1 ? "s" : ""} queued${result.failed ? ` (${result.failed} failed)` : ""}`,
        result.failed ? "info" : "success"
      );
    } else {
      toast(result.error ?? "All scenes failed to queue", "error");
    }
    return result;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="glass-strong sticky top-0 z-30 flex items-center justify-between border-b px-4 py-4 lg:px-8">
          <motion.div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <motion.div>
              <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
                <span className="gradient-text">AI Video Studio</span>
              </h1>
              <p className="text-xs text-zinc-500">
                Wan2.2-T2V-A14B · SiliconFlow
              </p>
            </motion.div>
          </motion.div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refresh()}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
            <div className="hidden items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20 sm:flex">
              <Video className="h-3.5 w-3.5" />
              {readyVideos.length} ready
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 space-y-6 p-4 lg:p-8"
        >
          <StatsBar tasks={tasks} generating={generating || hasPending} />

          <AnimatePresence>
            {(generating || hasPending) && (
              <GeneratingBanner active={generating || hasPending} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                <p className="flex-1">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="shrink-0 opacity-70 hover:opacity-100"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-6 xl:grid-cols-5">
            <div className="space-y-6 xl:col-span-3">
              <PromptStudio
                onGenerate={handleGenerate}
                onGenerateAll={handleGenerateAll}
                generating={generating}
              />
              <VideoGallery videos={readyVideos} />
            </div>

            <motion.div className="xl:col-span-2">
              <LiveFeed tasks={tasks} />
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
