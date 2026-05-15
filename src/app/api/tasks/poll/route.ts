import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getVideoStatus,
  mapSiliconStatusToTask,
} from "@/lib/siliconflow";
import type { TaskStatus } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

async function pollTask(taskId: string) {
  const task = await db.getTaskById(taskId);
  if (!task) return null;

  if (["ready", "failed", "cancelled"].includes(task.status)) {
    return task;
  }

  try {
    const statusRes = await getVideoStatus(task.requestId);
    const mapped = mapSiliconStatusToTask(statusRes.status);

    let nextStatus: TaskStatus = mapped;
    let videoUrl = task.videoUrl;
    let error = task.error;

    if (statusRes.status === "Succeed") {
      const url = statusRes.results?.videos?.[0]?.url;
      if (url) {
        nextStatus = "ready";
        videoUrl = url;
      } else {
        nextStatus = "downloading";
      }
    } else if (statusRes.status === "Failed") {
      nextStatus = "failed";
      error = statusRes.reason ?? "Video generation failed";
    } else if (mapped === "generating" || mapped === "queued") {
      nextStatus = "generating";
    }

    return db.updateTask(task.id, {
      status: nextStatus,
      videoUrl,
      error,
      siliconStatus: statusRes.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Poll failed";
    return db.updateTask(task.id, {
      status: "failed",
      error: message,
    });
  }
}

export async function POST() {
  try {
    const pending = await db.getPendingTasks();
    const updated = await Promise.all(
      pending.map((t) => pollTask(t.id))
    );

    const tasks = await db.getAllTasks();
    const ready = tasks.filter((t) => t.status === "ready");

    return NextResponse.json({
      polled: updated.filter(Boolean).length,
      tasks,
      ready,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Polling failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
