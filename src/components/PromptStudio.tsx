"use client";

import { motion } from "framer-motion";
import { Clapperboard, Zap } from "lucide-react";
import { useState } from "react";
import type { QualityPreset } from "@/lib/types";
import { CinematicStoryForm } from "./CinematicStoryForm";
import { GenerationForm } from "./GenerationForm";

type Mode = "quick" | "cinematic";

interface PromptStudioProps {
  onGenerate: (
    prompt: string,
    preset: QualityPreset,
    sceneLabel?: string
  ) => Promise<{ success: boolean; error?: string }>;
  onGenerateAll: (
    items: { prompt: string; sceneLabel: string }[],
    preset: QualityPreset
  ) => Promise<{ success: number; failed: number; error?: string }>;
  generating: boolean;
}

export function PromptStudio({
  onGenerate,
  onGenerateAll,
  generating,
}: PromptStudioProps) {
  const [mode, setMode] = useState<Mode>("cinematic");

  return (
    <div className="space-y-4">
      <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setMode("cinematic")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            mode === "cinematic"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Clapperboard className="h-4 w-4" />
          Cinematic Story
        </button>
        <button
          type="button"
          onClick={() => setMode("quick")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            mode === "quick"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Zap className="h-4 w-4" />
          Quick Prompt
        </button>
      </div>

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {mode === "cinematic" ? (
          <CinematicStoryForm
            onGenerateScene={onGenerate}
            onGenerateAll={onGenerateAll}
            generating={generating}
          />
        ) : (
          <GenerationForm onGenerate={onGenerate} generating={generating} />
        )}
      </motion.div>
    </div>
  );
}
