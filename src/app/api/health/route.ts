import { NextResponse } from "next/server";
import { VIDEO_MODEL } from "@/lib/siliconflow";

export const runtime = "nodejs";

export async function GET() {
  const hasKey = Boolean(process.env.SILICONFLOW_API_KEY);
  return NextResponse.json({
    ok: hasKey,
    model: VIDEO_MODEL,
    platform: process.env.NETLIFY ? "netlify" : "local",
  });
}
