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

const PENDING: VideoTask["status"][] = ["queued", "generating", "downloading"];

function isPendingStatus(status: VideoTask["status"]): boolean {
  return PENDING.includes(status);
}

/** Client cancel must win over server poll still showing in-progress */
function pickNewerTask(a: VideoTask, b: VideoTask): VideoTask {
  if (a.status === "cancelled" && isPendingStatus(b.status)) return a;
  if (b.status === "cancelled" && isPendingStatus(a.status)) return b;
  return new Date(a.updatedAt) >= new Date(b.updatedAt) ? a : b;
}

export function mergeTasks(
  server: VideoTask[],
  client: VideoTask[]
): VideoTask[] {
  const map = new Map<string, VideoTask>();
  for (const t of [...client, ...server]) {
    const existing = map.get(t.id);
    if (!existing) {
      map.set(t.id, t);
    } else {
      map.set(t.id, pickNewerTask(existing, t));
    }
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
