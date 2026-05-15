/** SiliconFlow recommends cohesive prompts; we cap assembled API text while keeping full script in UI */

export const CINEMATIC_EDITOR_MAX = 12000;
export const API_PROMPT_SOFT_MAX = 2200;

export interface CinematicScene {
  id: string;
  title: string;
  action: string;
}

export interface CinematicProject {
  character: string;
  style: string;
  scenes: CinematicScene[];
}

export const SOVIET_BUNKER_TEMPLATE: CinematicProject = {
  character:
    "Same Russian officer in all scenes, consistent face and body, male, 45 years old, Soviet military uniform, realistic movement, natural human behavior, realistic facial expressions, realistic hand motion.",
  style:
    "Ultra realistic cinematic video, 1983 Soviet nuclear bunker, high-budget Hollywood style, dark Cold War atmosphere, red emergency lighting, green CRT radar screens, old Soviet military control room, detailed environment, realistic shadows, realistic skin texture, film grain, anamorphic lens, 4K, extremely detailed, believable acting, physically accurate motion, no exaggerated AI movement, no cartoon look, smooth cinematic camera movement.",
  scenes: [
    {
      id: "1",
      title: "Scene 1",
      action:
        "The officer sits naturally in front of Soviet radar screens, slowly observing data, subtle breathing and eye movement, cinematic slow camera push-in.",
    },
    {
      id: "2",
      title: "Scene 2",
      action:
        "Alarm appears on screen, the officer turns his head realistically toward the monitor, eyes reacting with confusion and tension, red warning lights flashing softly.",
    },
    {
      id: "3",
      title: "Scene 3",
      action:
        "Close-up of the officer reading incoming missile alert, realistic blinking, small facial tension, hand resting near control buttons.",
    },
    {
      id: "4",
      title: "Scene 4",
      action:
        "The officer slowly reaches toward an old Soviet telephone, hesitates naturally, fingers stop before touching it, realistic nervous breathing.",
    },
    {
      id: "5",
      title: "Scene 5",
      action:
        "The officer thinking silently under flashing red lights, subtle head movement, emotional realism, cinematic side profile shot.",
    },
    {
      id: "6",
      title: "Scene 6",
      action:
        "The officer lowers his hand and decides not to report the alert, remaining seated in silence while radar screens glow behind him, realistic ending shot, slow cinematic camera movement.",
    },
  ],
};

export function createSceneId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** One paragraph per clip — character + style + single scene action */
export function assembleScenePrompt(
  project: CinematicProject,
  scene: CinematicScene
): string {
  const parts = [
    project.style.trim(),
    project.character.trim(),
    scene.action.trim(),
  ].filter(Boolean);
  return parts.join(" ");
}

export function assembleFullScript(project: CinematicProject): string {
  const header = [project.style, project.character].filter(Boolean).join("\n\n");
  const body = project.scenes
    .map((s) => `${s.title}: ${s.action}`)
    .join("\n\n");
  return `${header}\n\n${body}`;
}

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.7 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/** Fit within API-friendly length while preserving character consistency */
export function fitPromptForApi(prompt: string, max = API_PROMPT_SOFT_MAX): string {
  return truncateAtWord(prompt.replace(/\s+/g, " ").trim(), max);
}

export function parseScenesFromFullText(fullText: string): CinematicScene[] {
  const lines = fullText.split(/\n+/).filter((l) => l.trim());
  const scenes: CinematicScene[] = [];
  let current: CinematicScene | null = null;

  for (const line of lines) {
    const match = line.match(/^Scene\s*(\d+)\s*:\s*(.*)$/i);
    if (match) {
      if (current) scenes.push(current);
      current = {
        id: createSceneId(),
        title: `Scene ${match[1]}`,
        action: match[2].trim(),
      };
    } else if (current) {
      current.action += (current.action ? " " : "") + line.trim();
    }
  }
  if (current) scenes.push(current);
  return scenes;
}
