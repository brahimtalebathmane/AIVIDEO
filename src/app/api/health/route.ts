import { NextResponse } from "next/server";
import { VIDEO_MODEL } from "@/lib/siliconflow";

export const runtime = "nodejs";

function detectPlatform(): string {
  if (process.env.NETLIFY === "true") return "netlify";
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return "serverless";
  if (process.env.URL?.includes("netlify.app")) return "netlify";
  return "local";
}

export async function GET() {
  const hasKey = Boolean(process.env.SILICONFLOW_API_KEY);
  return NextResponse.json({
    ok: hasKey,
    model: VIDEO_MODEL,
    platform: detectPlatform(),
    endpoints: {
      generate: "/api/generate",
      tasks: "/api/tasks",
      poll: "/api/tasks/poll",
    },
  });
}
