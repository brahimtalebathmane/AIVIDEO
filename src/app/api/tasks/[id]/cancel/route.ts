import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cancelVideoGeneration } from "@/lib/siliconflow";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await db.getTaskById(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status === "cancelled") {
      return NextResponse.json({ task });
    }

    if (["ready", "failed"].includes(task.status)) {
      return NextResponse.json(
        { error: "Cannot cancel a completed task" },
        { status: 409 }
      );
    }

    await cancelVideoGeneration(task.requestId);

    const updated = await db.updateTask(task.id, {
      status: "cancelled",
      error: undefined,
      siliconStatus: "Cancelled",
    });

    return NextResponse.json({
      task: updated ?? {
        ...task,
        status: "cancelled",
        siliconStatus: "Cancelled",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cancel failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
