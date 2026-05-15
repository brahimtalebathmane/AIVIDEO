"use client";

import { motion } from "framer-motion";
import { Clapperboard, Zap } from "lucide-react";
import { useState } from "react";
import type {
  ProductionGeneratePayload,
} from "@/hooks/useTasks";
import type { ImageSize } from "@/lib/production";
import type { QualityPreset } from "@/lib/types";
import { GenerationForm } from "./GenerationForm";
import { ProductionStudio } from "./ProductionStudio";

type Tab = "production" | "quick";

interface StudioShellProps {
  generating: boolean;
  onCancelSequence?: () => void;
  onQuickGenerate: (
    prompt: string,
    preset: QualityPreset,
    imageSize: ImageSize
  ) => Promise<{ success: boolean; error?: string }>;
  onProductionShot: (
    payload: ProductionGeneratePayload
  ) => Promise<{ success: boolean; error?: string }>;
  onProductionSequence: (
    payloads: ProductionGeneratePayload[],
    onProgress?: (done: number, total: number) => void
  ) => Promise<{
    success: number;
    failed: number;
    cancelled?: boolean;
    error?: string;
  }>;
}

export function StudioShell({
  generating,
  onCancelSequence,
  onQuickGenerate,
  onProductionShot,
  onProductionSequence,
}: StudioShellProps) {
  const [tab, setTab] = useState<Tab>("production");

  return (
    <motion.div className="space-y-4">
      <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setTab("production")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            tab === "production"
              ? "bg-gradient-to-r from-amber-600/80 to-violet-600/80 text-white shadow"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Clapperboard className="h-4 w-4" />
          Production
        </button>
        <button
          type="button"
          onClick={() => setTab("quick")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            tab === "quick"
              ? "bg-violet-600 text-white shadow"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Zap className="h-4 w-4" />
          Quick T2V
        </button>
      </div>

      {tab === "production" ? (
        <ProductionStudio
          generating={generating}
          onCancelSequence={onCancelSequence}
          onGenerateShot={onProductionShot}
          onGenerateSequence={onProductionSequence}
        />
      ) : (
        <GenerationForm
          onGenerate={onQuickGenerate}
          generating={generating}
        />
      )}
    </motion.div>
  );
}
