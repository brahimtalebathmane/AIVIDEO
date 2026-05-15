import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { submitVideoGeneration } from "@/lib/siliconflow";
import { QUALITY_PRESETS, type QualityPreset } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = String(body.prompt ?? "").trim();
    const preset = (body.preset ?? "cinematic") as QualityPreset;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const presetConfig = QUALITY_PRESETS[preset];
    if (!presetConfig) {
      return NextResponse.json(
        { error: "Invalid quality preset" },
        { status: 400 }
      );
    }

    const fullPrompt = `${prompt}${presetConfig.suffix}`;

    const { requestId } = await submitVideoGeneration({
      prompt: fullPrompt,
      imageSize: presetConfig.imageSize,
      negativePrompt:
        "blurry, low quality, distorted, watermark, text overlay, static image",
    });

    const task = await db.createTask({
      id: randomUUID(),
      requestId,
      prompt,
      preset,
      imageSize: presetConfig.imageSize,
      status: "generating",
      siliconStatus: "InQueue",
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
