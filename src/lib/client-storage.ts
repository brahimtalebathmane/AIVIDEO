import type { VideoTask } from "./types";

const STORAGE_KEY = "nexus-video-tasks-v1";

export function loadClientTasks(): VideoTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VideoTask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClientTasks(tasks: VideoTask[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(0, 50)));
  } catch {
    /* quota exceeded */
  }
}

export function mergeTasks(
  server: VideoTask[],
  client: VideoTask[]
): VideoTask[] {
  const map = new Map<string, VideoTask>();
  for (const t of [...client, ...server]) {
    const existing = map.get(t.id);
    if (!existing || new Date(t.updatedAt) > new Date(existing.updatedAt)) {
      map.set(t.id, t);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
