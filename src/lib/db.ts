import { promises as fs } from "fs";
import path from "path";
import type { TasksDatabase, VideoTask } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

const EMPTY_DB: TasksDatabase = { tasks: [] };

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readDb(): Promise<TasksDatabase> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(TASKS_FILE, "utf-8");
    return JSON.parse(raw) as TasksDatabase;
  } catch {
    return { ...EMPTY_DB };
  }
}

async function writeDb(db: TasksDatabase): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TASKS_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export async function getAllTasks(): Promise<VideoTask[]> {
  const db = await readDb();
  return db.tasks.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getTaskById(id: string): Promise<VideoTask | null> {
  const db = await readDb();
  return db.tasks.find((t) => t.id === id) ?? null;
}

export async function createTask(
  task: Omit<VideoTask, "createdAt" | "updatedAt">
): Promise<VideoTask> {
  const db = await readDb();
  const now = new Date().toISOString();
  const full: VideoTask = { ...task, createdAt: now, updatedAt: now };
  db.tasks.unshift(full);
  await writeDb(db);
  return full;
}

export async function updateTask(
  id: string,
  patch: Partial<VideoTask>
): Promise<VideoTask | null> {
  const db = await readDb();
  const idx = db.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  db.tasks[idx] = {
    ...db.tasks[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeDb(db);
  return db.tasks[idx];
}

export async function getPendingTasks(): Promise<VideoTask[]> {
  const tasks = await getAllTasks();
  return tasks.filter((t) =>
    ["queued", "generating", "downloading"].includes(t.status)
  );
}

/* Supabase migration hook — swap implementations here */
export type DatabaseAdapter = {
  getAllTasks: typeof getAllTasks;
  getTaskById: typeof getTaskById;
  createTask: typeof createTask;
  updateTask: typeof updateTask;
  getPendingTasks: typeof getPendingTasks;
};

export const db: DatabaseAdapter = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  getPendingTasks,
};
