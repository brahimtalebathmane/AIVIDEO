"use client";

import { motion } from "framer-motion";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { PROMPT_MAX_CHARS, SAMPLE_PROMPTS } from "@/lib/constants";
import { QUALITY_PRESETS, type QualityPreset } from "@/lib/types";

const PRESETS = Object.entries(QUALITY_PRESETS) as [
  QualityPreset,
  (typeof QUALITY_PRESETS)[QualityPreset],
][];

interface GenerationFormProps {
  onGenerate: (
    prompt: string,
    preset: QualityPreset
  ) => Promise<{ success: boolean; error?: string }>;
  generating: boolean;
}

export function GenerationForm({ onGenerate, generating }: GenerationFormProps) {
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState<QualityPreset>("cinematic");

  const charCount = prompt.length;
  const overLimit = charCount > PROMPT_MAX_CHARS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || generating || overLimit) return;
    const result = await onGenerate(prompt.trim(), preset);
    if (result.success) setPrompt("");
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="glass glow-accent rounded-2xl p-6 lg:p-8"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <motion.div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold">Create Video</h2>
        </motion.div>
        <span
          className={`text-xs tabular-nums ${
            overLimit ? "text-red-400" : "text-zinc-600"
          }`}
        >
          {charCount}/{PROMPT_MAX_CHARS}
        </span>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your scene — subject, action, camera angle, lighting, mood..."
        rows={5}
        disabled={generating}
        maxLength={PROMPT_MAX_CHARS + 50}
        className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
      />

      <motion.div className="mt-3 flex flex-wrap gap-2">
        <span className="w-full text-xs text-zinc-600">Try a sample:</span>
        {SAMPLE_PROMPTS.map((sample) => (
          <motion.button
            key={sample.label}
            type="button"
            disabled={generating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPrompt(sample.text)}
            className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300"
          >
            {sample.label}
          </motion.button>
        ))}
      </motion.div>

      <div className="mt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Quality Preset
        </p>
        <motion.div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
          initial="hidden"
          animate="show"
        >
          {PRESETS.map(([key, config]) => (
            <motion.button
              key={key}
              type="button"
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
              disabled={generating}
              onClick={() => setPreset(key)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                preset === key
                  ? "border-violet-500/60 bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/40"
                  : "border-white/5 bg-white/5 text-zinc-400 hover:border-white/15 hover:bg-white/10"
              }`}
            >
              {config.label}
            </motion.button>
          ))}
        </motion.div>
      </div>

      <motion.button
        type="submit"
        disabled={generating || !prompt.trim() || overLimit}
        whileHover={{ scale: generating ? 1 : 1.02 }}
        whileTap={{ scale: generating ? 1 : 0.98 }}
        className="relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {generating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="h-5 w-5" />
            </motion.div>
            <span>Submitting to AI engine…</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate Video
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
