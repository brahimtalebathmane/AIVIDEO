"use client";

import { motion } from "framer-motion";
import { Menu, RefreshCw, Video } from "lucide-react";
import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { GenerationForm } from "./GenerationForm";
import { LiveFeed } from "./LiveFeed";
import { Sidebar } from "./Sidebar";
import { VideoGallery } from "./VideoGallery";

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { tasks, readyVideos, loading, generating, error, generate, refresh } =
    useTasks();

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex min-h-screen flex-1 flex-col">
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
            <div>
              <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
                <span className="gradient-text">AI Video Studio</span>
              </h1>
              <p className="text-xs text-zinc-500">
                Text-to-video powered by Wan2.1-T2V-14B
              </p>
            </div>
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
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </motion.div>
          )}

          <motion.div className="grid gap-6 xl:grid-cols-5">
            <div className="space-y-6 xl:col-span-3">
              <GenerationForm
                onGenerate={generate}
                generating={generating}
              />
              <VideoGallery videos={readyVideos} />
            </div>

            <div className="xl:col-span-2">
              <LiveFeed tasks={tasks} />
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
