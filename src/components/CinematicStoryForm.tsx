"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Copy,
  Film,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  assembleFullScript,
  assembleScenePrompt,
  API_PROMPT_SOFT_MAX,
  CINEMATIC_EDITOR_MAX,
  createSceneId,
  fitPromptForApi,
  SOVIET_BUNKER_TEMPLATE,
  type CinematicProject,
  type CinematicScene,
} from "@/lib/cinematic-prompt";
import { QUALITY_PRESETS, type QualityPreset } from "@/lib/types";

const PRESETS = Object.entries(QUALITY_PRESETS) as [
  QualityPreset,
  (typeof QUALITY_PRESETS)[QualityPreset],
][];

interface CinematicStoryFormProps {
  onGenerateScene: (
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

export function CinematicStoryForm({
  onGenerateScene,
  onGenerateAll,
  generating,
}: CinematicStoryFormProps) {
  const [project, setProject] = useState<CinematicProject>(SOVIET_BUNKER_TEMPLATE);
  const [preset, setPreset] = useState<QualityPreset>("cinematic");
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    SOVIET_BUNKER_TEMPLATE.scenes[0]?.id ?? ""
  );
  const [showPreview, setShowPreview] = useState(false);
  const [fullScriptMode, setFullScriptMode] = useState(false);
  const [fullScript, setFullScript] = useState("");

  const selectedScene =
    project.scenes.find((s) => s.id === selectedSceneId) ?? project.scenes[0];

  const assembledForSelected = useMemo(() => {
    if (!selectedScene) return "";
    return assembleScenePrompt(project, selectedScene);
  }, [project, selectedScene]);

  const apiPreview = fitPromptForApi(assembledForSelected);

  const updateScene = (id: string, patch: Partial<CinematicScene>) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const addScene = () => {
    const scene: CinematicScene = {
      id: createSceneId(),
      title: `Scene ${project.scenes.length + 1}`,
      action: "",
    };
    setProject((p) => ({ ...p, scenes: [...p.scenes, scene] }));
    setSelectedSceneId(scene.id);
  };

  const removeScene = (id: string) => {
    setProject((p) => {
      const scenes = p.scenes.filter((s) => s.id !== id);
      return { ...p, scenes: scenes.length ? scenes : p.scenes };
    });
  };

  const loadTemplate = () => {
    setProject(SOVIET_BUNKER_TEMPLATE);
    setSelectedSceneId(SOVIET_BUNKER_TEMPLATE.scenes[0].id);
    setFullScriptMode(false);
  };

  const openFullScript = () => {
    setFullScript(assembleFullScript(project));
    setFullScriptMode(true);
  };

  const applyFullScript = () => {
    const lines = fullScript.split(/\n\n+/);
    let character = project.character;
    let style = project.style;
    const sceneLines: string[] = [];

    for (const block of lines) {
      const trimmed = block.trim();
      if (/^Scene\s+\d+/i.test(trimmed)) {
        sceneLines.push(trimmed);
      } else if (!style || style === project.style) {
        if (trimmed.toLowerCase().includes("same ") || trimmed.includes("officer")) {
          character = trimmed;
        } else {
          style = trimmed;
        }
      }
    }

    const scenes: CinematicScene[] = sceneLines.map((line, i) => {
      const m = line.match(/^Scene\s*(\d+)\s*:\s*([\s\S]*)$/i);
      return {
        id: createSceneId(),
        title: m ? `Scene ${m[1]}` : `Scene ${i + 1}`,
        action: m ? m[2].trim() : line,
      };
    });

    if (scenes.length > 0) {
      setProject({ character, style, scenes });
      setSelectedSceneId(scenes[0].id);
    }
    setFullScriptMode(false);
  };

  const handleGenerateOne = async () => {
    if (!selectedScene?.action.trim()) return;
    const prompt = fitPromptForApi(assembledForSelected);
    await onGenerateScene(prompt, preset, selectedScene.title);
  };

  const handleGenerateAll = async () => {
    const items = project.scenes
      .filter((s) => s.action.trim())
      .map((s) => ({
        prompt: fitPromptForApi(assembleScenePrompt(project, s)),
        sceneLabel: s.title,
      }));
    if (!items.length) return;
    await onGenerateAll(items, preset);
  };

  const scriptChars = assembleFullScript(project).length;

  if (fullScriptMode) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass glow-accent rounded-2xl p-6 lg:p-8"
      >
        <motion.div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Full script editor</h2>
          <span className="text-xs text-zinc-600">
            {fullScript.length.toLocaleString()} chars
          </span>
        </motion.div>
        <textarea
          value={fullScript}
          onChange={(e) => setFullScript(e.target.value)}
          rows={18}
          maxLength={CINEMATIC_EDITOR_MAX}
          disabled={generating}
          className="scrollbar-thin w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-4 font-mono text-xs leading-relaxed text-zinc-200 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          placeholder="Paste your full cinematic prompt..."
        />
        <p className="mt-2 text-xs text-zinc-500">
          Use &quot;Scene 1:&quot;, &quot;Scene 2:&quot; etc. to split into
          separate clips. Each scene becomes one ~5s video with shared character
          settings.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyFullScript}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Parse into scenes
          </button>
          <button
            type="button"
            onClick={() => setFullScriptMode(false)}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
          >
            Back to builder
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glow-accent rounded-2xl p-6 lg:p-8"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-5 w-5 text-violet-400" />
          <div>
            <h2 className="text-lg font-semibold">Cinematic Story</h2>
            <p className="text-xs text-zinc-500">
              Multi-scene · consistent character · one clip per scene
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadTemplate}
            disabled={generating}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20"
          >
            Soviet bunker template
          </button>
          <button
            type="button"
            onClick={openFullScript}
            disabled={generating}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5"
          >
            Edit full script
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Visual style & atmosphere
          </label>
          <textarea
            value={project.style}
            onChange={(e) =>
              setProject((p) => ({ ...p, style: e.target.value }))
            }
            rows={4}
            disabled={generating}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-zinc-100 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Character consistency (same in every scene)
          </label>
          <textarea
            value={project.character}
            onChange={(e) =>
              setProject((p) => ({ ...p, character: e.target.value }))
            }
            rows={3}
            disabled={generating}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-zinc-100 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Scenes ({project.scenes.length})
          </p>
          <button
            type="button"
            onClick={addScene}
            disabled={generating}
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Add scene
          </button>
        </div>

        <div className="scrollbar-thin max-h-[280px] space-y-2 overflow-y-auto pr-1">
          {project.scenes.map((scene) => (
            <div
              key={scene.id}
              className={`rounded-xl border p-3 transition-colors ${
                selectedSceneId === scene.id
                  ? "border-violet-500/40 bg-violet-500/10"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={scene.title}
                  onChange={(e) =>
                    updateScene(scene.id, { title: e.target.value })
                  }
                  onFocus={() => setSelectedSceneId(scene.id)}
                  disabled={generating}
                  className="flex-1 rounded-lg border border-white/5 bg-black/20 px-2 py-1 text-xs font-semibold text-violet-300 focus:border-violet-500/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSelectedSceneId(scene.id)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Select
                </button>
                {project.scenes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScene(scene.id)}
                    className="text-zinc-600 hover:text-red-400"
                    aria-label="Remove scene"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {selectedSceneId === scene.id && (
                <textarea
                  value={scene.action}
                  onChange={(e) =>
                    updateScene(scene.id, { action: e.target.value })
                  }
                  rows={3}
                  disabled={generating}
                  placeholder="Describe this scene's action and camera..."
                  className="w-full resize-y rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/30 focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowPreview((v) => !v)}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-xs text-zinc-500 hover:bg-white/5"
      >
        <span>
          API prompt preview ({apiPreview.length}/{API_PROMPT_SOFT_MAX} chars)
        </span>
        {showPreview ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <pre className="scrollbar-thin mt-2 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap">
              {apiPreview}
            </pre>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(apiPreview)}
              className="mt-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
            >
              <Copy className="h-3 w-3" />
              Copy API prompt
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Quality Preset
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map(([key, config]) => (
            <button
              key={key}
              type="button"
              disabled={generating}
              onClick={() => setPreset(key)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                preset === key
                  ? "border-violet-500/60 bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/40"
                  : "border-white/5 bg-white/5 text-zinc-400 hover:border-white/15"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <motion.button
          type="button"
          disabled={generating || !selectedScene?.action.trim()}
          whileHover={{ scale: generating ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerateOne}
          className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 py-4 text-sm font-semibold text-violet-200 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Film className="h-4 w-4" />
          )}
          Generate {selectedScene?.title ?? "scene"}
        </motion.button>

        <motion.button
          type="button"
          disabled={
            generating ||
            project.scenes.every((s) => !s.action.trim())
          }
          whileHover={{ scale: generating ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerateAll}
          className="relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate all {project.scenes.length} scenes
        </motion.button>
      </div>

      <p className="mt-3 text-center text-xs text-zinc-600">
        Full script: {scriptChars.toLocaleString()} chars · Each scene ≈ 5s
        clip · ~2–5 min render per scene
      </p>
    </motion.div>
  );
}
