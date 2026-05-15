"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, RefreshCw, Video, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { GeneratingBanner } from "./GeneratingBanner";
import { LiveFeed } from "./LiveFeed";
import { Sidebar, type NavSection } from "./Sidebar";
import { StatsBar } from "./StatsBar";
import { StudioShell } from "./StudioShell";
import { useToast } from "./Toast";
import { VideoGallery } from "./VideoGallery";

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [apiStatus, setApiStatus] = useState<{
    ok: boolean;
    platform?: string;
  } | null>(null);
  const { toast } = useToast();

  const scrollToSection = useCallback((section: NavSection) => {
    setActiveSection(section);
    const id =
      section === "dashboard"
        ? "dashboard-top"
        : section === "studio"
          ? "studio"
          : section === "gallery"
            ? "video-gallery"
            : "api-status";
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  useEffect(() => {
    if (activeSection !== "api") return;
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setApiStatus({ ok: Boolean(data.ok), platform: data.platform }))
      .catch(() => setApiStatus({ ok: false }));
  }, [activeSection]);
  const {
    tasks,
    readyVideos,
    pendingTasks,
    loading,
    generating,
    hasPending,
    error,
    setError,
    generate,
    generateProductionShot,
    generateProductionSequence,
    cancelTask,
    cancelAllPending,
    cancelSequence,
    refresh,
  } = useTasks();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onNavigate={scrollToSection}
        apiStatus={apiStatus}
      />

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="glass-strong sticky top-0 z-30 flex items-center justify-between border-b px-4 py-4 lg:px-8">
          <div className="flex items-center gap-4">
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
                Production I2V · Wan2.2 · SiliconFlow
              </p>
            </div>
          </div>

          <motion.div className="flex items-center gap-2">
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
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 space-y-6 p-4 lg:p-8"
        >
          <div id="dashboard-top">
            <StatsBar tasks={tasks} generating={generating || hasPending} />
          </div>

          <div
            id="api-status"
            className={`scroll-mt-24 rounded-xl border px-4 py-3 text-sm transition-colors ${
              activeSection === "api"
                ? "border-violet-500/30 bg-violet-500/10 text-violet-200"
                : "border-transparent py-0 opacity-0 h-0 overflow-hidden p-0"
            }`}
          >
            {activeSection === "api" && apiStatus && (
              <p>
                API key:{" "}
                <strong>{apiStatus.ok ? "configured" : "missing"}</strong>
                {apiStatus.platform ? ` · ${apiStatus.platform}` : ""}.{" "}
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Health JSON
                </a>
              </p>
            )}
          </div>

          <AnimatePresence>
            {(generating || hasPending) && (
              <GeneratingBanner
                active={generating || hasPending}
                pendingTasks={pendingTasks}
                onCancelAll={async () => {
                  try {
                    cancelSequence();
                    await cancelAllPending();
                    toast("Generation stopped", "info");
                  } catch {
                    toast("Could not cancel all tasks", "error");
                  }
                }}
              />
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
              <div id="studio" className="scroll-mt-24">
              <StudioShell
                generating={generating}
                onCancelSequence={cancelSequence}
                onQuickGenerate={async (prompt, preset, imageSize) => {
                  const result = await generate(prompt, preset, imageSize);
                  if (result.success) {
                    toast("Quick clip queued — ~2–5 min", "success");
                  } else {
                    toast(result.error ?? "Failed", "error");
                  }
                  return result;
                }}
                onProductionShot={async (payload) => {
                  const result = await generateProductionShot(payload);
                  if (result.success) {
                    toast(
                      `${payload.shotLabel} queued with locked reference`,
                      "success"
                    );
                  } else {
                    toast(result.error ?? "Failed", "error");
                  }
                  return result;
                }}
                onProductionSequence={async (payloads, onProgress) => {
                  const result = await generateProductionSequence(
                    payloads,
                    onProgress
                  );
                  if (result.cancelled) {
                    toast("Sequence stopped — pending jobs cancelled", "info");
                  } else if (result.success > 0) {
                    toast(
                      `${result.success} shots queued${result.failed ? ` · ${result.failed} failed` : ""}`,
                      result.failed ? "info" : "success"
                    );
                  } else {
                    toast(result.error ?? "Sequence failed", "error");
                  }
                  return result;
                }}
              />
              </div>
              <div id="video-gallery" className="scroll-mt-24">
                <VideoGallery videos={readyVideos} />
              </div>
            </div>

            <div className="xl:col-span-2">
              <LiveFeed
                tasks={tasks}
                onCancelTask={async (id) => {
                  try {
                    await cancelTask(id);
                    toast("Generation cancelled", "info");
                  } catch {
                    toast("Could not cancel task", "error");
                  }
                }}
              />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
