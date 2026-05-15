export type ImageSize = "1280x720" | "720x1280" | "960x960";

export interface ProductionBible {
  character: string;
  environment: string;
  look: string;
}

export interface ProductionShot {
  id: string;
  label: string;
  action: string;
}

export interface ProductionSequence {
  id: string;
  name: string;
  bible: ProductionBible;
  referenceImage: string | null;
  imageSize: ImageSize;
  seed: number | null;
  shots: ProductionShot[];
}

export const API_PROMPT_MAX = 2200;

export const NEGATIVE_PROMPT =
  "blurry, low quality, distorted, watermark, text overlay, static image, cartoon, exaggerated motion, morphing face, duplicate limbs";

export const DEFAULT_BIBLE: ProductionBible = {
  character:
    "Same Russian officer in every shot, consistent face and body, male 45 years old, Soviet military uniform, realistic movement, natural human behavior, realistic facial expressions, realistic hand motion.",
  environment:
    "1983 Soviet nuclear bunker, old Soviet military control room, green CRT radar screens, detailed environment, realistic shadows.",
  look:
    "Ultra realistic cinematic, dark Cold War atmosphere, red emergency lighting, film grain, anamorphic lens, 4K detail, high-budget Hollywood style, smooth cinematic camera, believable acting, physically accurate motion, no cartoon look.",
};

export const BUNKER_SHOTS: Omit<ProductionShot, "id">[] = [
  {
    label: "Scene 1",
    action:
      "Officer sits before radar screens, slowly observing data, subtle breathing and eye movement, slow camera push-in.",
  },
  {
    label: "Scene 2",
    action:
      "Alarm on screen, officer turns head toward monitor, confusion and tension in eyes, red warning lights flash softly.",
  },
  {
    label: "Scene 3",
    action:
      "Close-up reading missile alert, realistic blinking, facial tension, hand near control buttons.",
  },
  {
    label: "Scene 4",
    action:
      "Officer reaches toward Soviet telephone, hesitates, fingers stop before touching, nervous breathing.",
  },
  {
    label: "Scene 5",
    action:
      "Officer thinking under flashing red lights, subtle head movement, cinematic side profile.",
  },
  {
    label: "Scene 6",
    action:
      "Officer lowers hand, decides not to report, seated in silence, radar glow behind, slow cinematic camera.",
  },
];

export function createShotId(): string {
  return `shot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createSequenceId(): string {
  return `seq-${Date.now()}`;
}

export function defaultSequence(): ProductionSequence {
  return {
    id: createSequenceId(),
    name: "Soviet Bunker Sequence",
    bible: { ...DEFAULT_BIBLE },
    referenceImage: null,
    imageSize: "1280x720",
    seed: null,
    shots: BUNKER_SHOTS.map((s) => ({ ...s, id: createShotId() })),
  };
}

export function assembleShotPrompt(
  bible: ProductionBible,
  shotAction: string
): string {
  const parts = [
    bible.look.trim(),
    bible.environment.trim(),
    bible.character.trim(),
    shotAction.trim(),
    "Natural subtle motion only for this moment. Single continuous take.",
  ].filter(Boolean);
  return truncatePrompt(parts.join(" "));
}

function truncatePrompt(text: string, max = API_PROMPT_MAX): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const cut = normalized.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.75 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

export function detectImageSize(
  width: number,
  height: number
): ImageSize {
  const ratio = width / height;
  if (ratio > 1.2) return "1280x720";
  if (ratio < 0.85) return "720x1280";
  return "960x960";
}
