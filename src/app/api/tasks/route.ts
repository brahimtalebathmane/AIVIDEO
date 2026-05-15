import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tasks = await db.getAllTasks();
    const ready = tasks.filter((t) => t.status === "ready");
    return NextResponse.json({ tasks, ready });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tasks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
