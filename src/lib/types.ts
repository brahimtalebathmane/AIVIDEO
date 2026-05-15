export type TaskStatus =
  | "queued"
  | "generating"
  | "downloading"
  | "ready"
  | "failed"
  | "cancelled";

export type QualityPreset =
  | "fast"
  | "cinematic"
  | "realistic"
  | "anime"
  | "3d";

export type PresetTier = "fast" | "quality";

export type GenerationMode = "t2v" | "i2v";

export interface VideoTask {
  id: string;
  requestId: string;
  prompt: string;
  preset: QualityPreset;
  mode?: GenerationMode;
  sequenceName?: string;
  shotLabel?: string;
  imageSize: string;
  status: TaskStatus;
  videoUrl?: string;
  localPath?: string;
  error?: string;
  siliconStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TasksDatabase {
  tasks: VideoTask[];
}

export interface PresetConfig {
  label: string;
  hint: string;
  suffix: string;
  imageSize: string;
  tier: PresetTier;
  /** Override T2V model; defaults to Wan2.2 quality model */
  t2vModel?: string;
  /** Override I2V model; defaults to Wan2.2 quality model */
  i2vModel?: string;
}

export const QUALITY_PRESETS: Record<QualityPreset, PresetConfig> = {
  fast: {
    label: "Fast",
    hint: "Turbo · ~2× faster",
    tier: "fast",
    suffix:
      " Smooth natural motion, stable subject, coherent scene, realistic lighting, clear textures, cinematic framing, temporally consistent frames.",
    imageSize: "1280x720",
    t2vModel: "Wan-AI/Wan2.1-T2V-14B-720P-Turbo",
    i2vModel: "Wan-AI/Wan2.1-I2V-14B-720P-Turbo",
  },
  cinematic: {
    label: "Cinematic",
    hint: "Best motion · film look",
    tier: "quality",
    suffix:
      " Cinematic film look, smooth fluid camera motion, volumetric dramatic lighting, detailed surface textures, natural character movement, stable geometry, shallow depth of field, anamorphic lens character, professional color grade, 24fps film motion, no visual artifacts.",
    imageSize: "1280x720",
  },
  realistic: {
    label: "Realistic",
    hint: "Photoreal · natural light",
    tier: "quality",
    suffix:
      " Photorealistic, physically accurate lighting and shadows, true-to-life colors, high-frequency skin and fabric textures, documentary realism, smooth believable motion, stable anatomy, natural micro-movements, no distortion.",
    imageSize: "1280x720",
  },
  anime: {
    label: "Anime",
    hint: "Stylized · clean motion",
    tier: "quality",
    suffix:
      " Anime style, vibrant colors, cel-shaded, expressive characters, fluid animation timing, consistent line art, studio-quality in-between frames, smooth motion arcs.",
    imageSize: "1280x720",
  },
  "3d": {
    label: "3D Render",
    hint: "CGI · ray-traced",
    tier: "quality",
    suffix:
      " 3D rendered, octane render quality, ray-traced global illumination, detailed PBR materials, smooth surfaces, physically based motion, unreal engine cinematic quality.",
    imageSize: "960x960",
  },
};
