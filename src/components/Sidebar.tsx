"use client";

import { motion } from "framer-motion";
import {
  Clapperboard,
  Film,
  LayoutDashboard,
  Sparkles,
  Zap,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Film, label: "Gallery", active: false },
  { icon: Sparkles, label: "Studio", active: false },
  { icon: Zap, label: "API", active: false },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
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
            <p className="text-xs text-zinc-500">Wan2.1 T2V Studio</p>
          </motion.div>
        </motion.div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                item.active
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
              Wan2.1-T2V-14B-720P
            </p>
            <p className="mt-2 text-xs text-zinc-600">via SiliconFlow</p>
          </motion.div>
        </div>
      </aside>
    </>
  );
}
