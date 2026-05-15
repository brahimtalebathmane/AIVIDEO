import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getVideoStatus,
  mapSiliconStatusToTask,
} from "@/lib/siliconflow";
import type { TaskStatus } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let task = await db.getTaskById(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status === "cancelled") {
      return NextResponse.json({ task });
    }

    if (!["ready", "failed"].includes(task.status)) {
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
      } else {
        nextStatus = "generating";
      }

      task =
        (await db.updateTask(task.id, {
          status: nextStatus,
          videoUrl,
          error,
          siliconStatus: statusRes.status,
        })) ?? task;
    }

    return NextResponse.json({ task });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
