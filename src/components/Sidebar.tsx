"use client";

import { motion } from "framer-motion";
import {
  Clapperboard,
  Film,
  LayoutDashboard,
  Sparkles,
  Zap,
} from "lucide-react";

export type NavSection = "dashboard" | "studio" | "gallery" | "api";

const navItems: {
  id: NavSection;
  icon: typeof LayoutDashboard;
  label: string;
}[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "gallery", icon: Film, label: "Gallery" },
  { id: "studio", icon: Sparkles, label: "Studio" },
  { id: "api", icon: Zap, label: "API" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  apiStatus?: { ok: boolean; platform?: string } | null;
}

export function Sidebar({
  open,
  onClose,
  activeSection,
  onNavigate,
  apiStatus,
}: SidebarProps) {
  return (
    <>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`glass-strong fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 border-b border-white/5 px-6 py-6"
        >
          <motion.div
            whileHover={{ rotate: 12, scale: 1.05 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 glow-accent"
          >
            <Clapperboard className="h-5 w-5 text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-lg font-bold tracking-tight">Nexus Video</h1>
            <p className="text-xs text-zinc-500">Wan2.2 · T2V + I2V</p>
          </motion.div>
        </motion.div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                activeSection === item.id
                  ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </motion.button>
          ))}
        </nav>

        <div className="border-t border-white/5 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-4"
          >
            <p className="text-xs font-medium text-zinc-400">Model</p>
            <p className="mt-1 truncate text-sm font-semibold text-zinc-200">
              Wan2.2 I2V + T2V
            </p>
            {activeSection === "api" && apiStatus && (
              <motion.div className="mt-3 space-y-1 border-t border-white/5 pt-3 text-xs">
                <p className="text-zinc-500">API status</p>
                <p
                  className={
                    apiStatus.ok ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {apiStatus.ok ? "Key configured" : "Missing API key"}
                </p>
                {apiStatus.platform && (
                  <p className="text-zinc-600">Host: {apiStatus.platform}</p>
                )}
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-violet-400 hover:underline"
                >
                  Open /api/health
                </a>
              </motion.div>
            )}
            <p className="mt-2 text-xs text-zinc-600">Production pipeline</p>
          </motion.div>
        </div>
      </aside>
    </>
  );
}
