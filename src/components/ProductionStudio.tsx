"use client";

import { motion } from "framer-motion";
import {
  Clapperboard,
  Film,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AspectRatioPicker } from "@/components/AspectRatioPicker";
import type { ProductionGeneratePayload } from "@/hooks/useTasks";
import {
  assembleShotPrompt,
  createShotId,
  defaultSequence,
  type ProductionSequence,
  type ProductionShot,
} from "@/lib/production";
import { loadSequence, saveSequence } from "@/lib/project-storage";
import { QUALITY_PRESETS, type QualityPreset } from "@/lib/types";

const PRESETS = Object.entries(QUALITY_PRESETS) as [
  QualityPreset,
  (typeof QUALITY_PRESETS)[QualityPreset],
][];

interface ProductionStudioProps {
  generating: boolean;
  onCancelSequence?: () => void;
  onGenerateShot: (
    payload: ProductionGeneratePayload
  ) => Promise<{ success: boolean; error?: string }>;
  onGenerateSequence: (
    payloads: ProductionGeneratePayload[],
    onProgress?: (done: number, total: number) => void
  ) => Promise<{ success: number; failed: number; error?: string }>;
}

export function ProductionStudio({
  generating,
  onCancelSequence,
  onGenerateShot,
  onGenerateSequence,
}: ProductionStudioProps) {
  const [sequence, setSequence] = useState<ProductionSequence>(defaultSequence);
  const [preset, setPreset] = useState<QualityPreset>("cinematic");
  const [selectedId, setSelectedId] = useState<string>("");
  const [batchProgress, setBatchProgress] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadSequence();
    if (saved) {
      setSequence(saved);
      setSelectedId(saved.shots[0]?.id ?? "");
    } else {
      setSelectedId(defaultSequence().shots[0]?.id ?? "");
    }
  }, []);

  useEffect(() => {
    saveSequence(sequence);
  }, [sequence]);

  const selected =
    sequence.shots.find((s) => s.id === selectedId) ?? sequence.shots[0];

  const updateShot = (id: string, patch: Partial<ProductionShot>) => {
    setSequence((s) => ({
      ...s,
      shots: s.shots.map((shot) =>
        shot.id === id ? { ...shot, ...patch } : shot
      ),
    }));
  };

  const addShot = () => {
    const shot = {
      id: createShotId(),
      label: `Scene ${sequence.shots.length + 1}`,
      action: "",
    };
    setSequence((s) => ({ ...s, shots: [...s.shots, shot] }));
    setSelectedId(shot.id);
  };

  const removeShot = (id: string) => {
    setSequence((s) => {
      const shots = s.shots.filter((shot) => shot.id !== id);
      return { ...s, shots: shots.length ? shots : s.shots };
    });
  };

  const buildPayload = useCallback(
    (shot: ProductionShot): ProductionGeneratePayload | null => {
      if (!shot.action.trim()) return null;
      const { character, environment, look } = sequence.bible;
      if (!character.trim() || !environment.trim() || !look.trim()) return null;
      return {
        imageSize: sequence.imageSize,
        bible: sequence.bible,
        shotAction: shot.action.trim(),
        shotLabel: shot.label,
        sequenceName: sequence.name,
        seed: sequence.seed,
        preset,
      };
    },
    [sequence, preset]
  );

  const handleOne = async () => {
    if (!selected) return;
    const payload = buildPayload(selected);
    if (!payload) return;
    await onGenerateShot(payload);
  };

  const handleAll = async () => {
    const payloads = sequence.shots
      .map(buildPayload)
      .filter((p): p is ProductionGeneratePayload => p !== null);
    if (!payloads.length) return;
    setBatchProgress(`0 / ${payloads.length}`);
    await onGenerateSequence(payloads, (done, total) => {
      setBatchProgress(`${done} / ${total}`);
    });
    setBatchProgress(null);
  };

  const preview =
    selected && assembleShotPrompt(sequence.bible, selected.action);

  const bibleReady =
    sequence.bible.character.trim() &&
    sequence.bible.environment.trim() &&
    sequence.bible.look.trim();
  const canGenerate = bibleReady && sequence.shots.some((s) => s.action.trim());

  return (
    <motion.div className="glass glow-accent rounded-2xl p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Production Pipeline</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Text-to-video · shared creative bible · Wan2.2-T2V
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const d = defaultSequence();
            setSequence(d);
            setSelectedId(d.shots[0]?.id ?? "");
          }}
          disabled={generating}
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20"
        >
          Load bunker template
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-200/90">
        <strong className="text-amber-100">Series workflow:</strong> Define
        character, environment, and look once — every shot is generated from
        text with the same creative bible. Each clip can use a{" "}
        <em>different</em> camera angle and composition instead of copying one
        reference still.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AspectRatioPicker
          value={sequence.imageSize}
          onChange={(imageSize) =>
            setSequence((s) => ({ ...s, imageSize }))
          }
          disabled={generating}
        />
        <div className="space-y-3">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Sequence name
          </label>
          <input
            value={sequence.name}
            onChange={(e) =>
              setSequence((s) => ({ ...s, name: e.target.value }))
            }
            disabled={generating}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm focus:border-violet-500/50 focus:outline-none"
          />
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Seed (optional — similar motion feel across shots)
          </label>
          <input
            type="number"
            placeholder="e.g. 42"
            value={sequence.seed ?? ""}
            onChange={(e) =>
              setSequence((s) => ({
                ...s,
                seed: e.target.value ? Number(e.target.value) : null,
              }))
            }
            disabled={generating}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm focus:border-violet-500/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Quality preset
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {PRESETS.map(([key, config]) => (
            <button
              key={key}
              type="button"
              disabled={generating}
              onClick={() => setPreset(key)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                preset === key
                  ? "border-violet-500/60 bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/40"
                  : "border-white/5 bg-white/5 text-zinc-400 hover:border-white/15"
              }`}
            >
              <span className="block text-sm font-medium">{config.label}</span>
              <span className="mt-0.5 block text-[10px] opacity-70">
                {config.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Character (series-wide)
          </label>
          <textarea
            value={sequence.bible.character}
            onChange={(e) =>
              setSequence((s) => ({
                ...s,
                bible: { ...s.bible, character: e.target.value },
              }))
            }
            rows={4}
            disabled={generating}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/50 focus:outline-none"
          />
        </motion.div>
        <motion.div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Environment (series-wide)
          </label>
          <textarea
            value={sequence.bible.environment}
            onChange={(e) =>
              setSequence((s) => ({
                ...s,
                bible: { ...s.bible, environment: e.target.value },
              }))
            }
            rows={4}
            disabled={generating}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/50 focus:outline-none"
          />
        </motion.div>
        <motion.div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Cinematic look (series-wide)
          </label>
          <textarea
            value={sequence.bible.look}
            onChange={(e) =>
              setSequence((s) => ({
                ...s,
                bible: { ...s.bible, look: e.target.value },
              }))
            }
            rows={4}
            disabled={generating}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/50 focus:outline-none"
          />
        </motion.div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Shot list — unique action per clip
          </p>
          <button
            type="button"
            onClick={addShot}
            disabled={generating}
            className="flex items-center gap-1 text-xs text-violet-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Add shot
          </button>
        </div>

        <div className="scrollbar-thin max-h-64 space-y-2 overflow-y-auto">
          {sequence.shots.map((shot) => (
            <div
              key={shot.id}
              className={`rounded-xl border p-3 ${
                selectedId === shot.id
                  ? "border-violet-500/40 bg-violet-500/10"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={shot.label}
                  onChange={(e) =>
                    updateShot(shot.id, { label: e.target.value })
                  }
                  onFocus={() => setSelectedId(shot.id)}
                  className="flex-1 rounded-lg border border-white/5 bg-black/20 px-2 py-1 text-xs font-semibold text-violet-300 focus:outline-none"
                />
                {sequence.shots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeShot(shot.id)}
                    className="text-zinc-600 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {selectedId === shot.id && (
                <textarea
                  value={shot.action}
                  onChange={(e) =>
                    updateShot(shot.id, { action: e.target.value })
                  }
                  rows={2}
                  disabled={generating}
                  placeholder="This shot only: action + camera move (e.g. wide establishing, close-up, over-shoulder)"
                  className="w-full resize-y rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-sm focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {!bibleReady && (
        <p className="mt-4 text-xs text-amber-400/90">
          Fill in character, environment, and cinematic look to enable generation.
        </p>
      )}

      {selected && preview && (
        <details className="mt-4 rounded-lg border border-white/5 bg-black/20 p-3">
          <summary className="cursor-pointer text-xs text-zinc-500">
            API prompt preview ({preview.length} chars)
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">{preview}</p>
        </details>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={generating || !canGenerate || !selected?.action.trim()}
          onClick={handleOne}
          className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 py-4 text-sm font-semibold text-violet-200 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Film className="h-4 w-4" />
          )}
          Generate {selected?.label ?? "shot"}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={generating || !canGenerate}
            onClick={handleAll}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 py-4 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {batchProgress ?? `Generate all ${sequence.shots.length} shots`}
          </button>
          {generating && batchProgress && onCancelSequence && (
            <button
              type="button"
              onClick={onCancelSequence}
              className="shrink-0 rounded-xl border border-red-500/40 bg-red-500/15 px-4 text-sm font-medium text-red-300 hover:bg-red-500/25"
              title="Stop queuing shots and cancel active jobs"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
