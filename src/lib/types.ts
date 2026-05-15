export type TaskStatus =
  | "queued"
  | "generating"
  | "downloading"
  | "ready"
  | "failed";

export type QualityPreset = "cinematic" | "realistic" | "anime" | "3d";

export interface VideoTask {
  id: string;
  requestId: string;
  prompt: string;
  sceneLabel?: string;
  preset: QualityPreset;
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

export const QUALITY_PRESETS: Record<
  QualityPreset,
  { label: string; suffix: string; imageSize: string }
> = {
  cinematic: {
    label: "Cinematic",
    suffix:
      " Cinematic film look, dramatic lighting, shallow depth of field, anamorphic lens flare, professional color grading, 24fps motion.",
    imageSize: "1280x720",
  },
  realistic: {
    label: "Realistic",
    suffix:
      " Photorealistic, natural lighting, true-to-life colors, high detail textures, documentary style footage.",
    imageSize: "1280x720",
  },
  anime: {
    label: "Anime",
    suffix:
      " Anime style, vibrant colors, cel-shaded, expressive characters, dynamic motion lines, studio animation quality.",
    imageSize: "1280x720",
  },
  "3d": {
    label: "3D Render",
    suffix:
      " 3D rendered, octane render quality, ray-traced lighting, smooth surfaces, CGI aesthetic, unreal engine style.",
    imageSize: "960x960",
  },
};
