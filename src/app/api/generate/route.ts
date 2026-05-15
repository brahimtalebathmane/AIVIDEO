import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import {
  assembleShotPrompt,
  isValidImageSize,
  NEGATIVE_PROMPT,
} from "@/lib/production";
import {
  I2V_MODEL,
  submitImageToVideo,
  submitVideoGeneration,
  VIDEO_MODEL,
} from "@/lib/siliconflow";
import { QUALITY_PRESETS, type GenerationMode, type QualityPreset } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = (body.mode ?? "t2v") as GenerationMode;
    const preset = (body.preset ?? "cinematic") as QualityPreset;
    const shotLabel = body.shotLabel ? String(body.shotLabel).trim() : undefined;
    const sequenceName = body.sequenceName
      ? String(body.sequenceName).trim()
      : undefined;
    const seed =
      typeof body.seed === "number" && Number.isFinite(body.seed)
        ? Math.floor(body.seed)
        : undefined;

    const presetConfig = QUALITY_PRESETS[preset];
    if (!presetConfig) {
      return NextResponse.json(
        { error: "Invalid quality preset" },
        { status: 400 }
      );
    }

    const t2vModel = presetConfig.t2vModel ?? VIDEO_MODEL;
    const i2vModel = presetConfig.i2vModel ?? I2V_MODEL;

    let fullPrompt: string;
    let imageSize = presetConfig.imageSize;
    if (body.imageSize && isValidImageSize(String(body.imageSize))) {
      imageSize = body.imageSize;
    }
    let requestId: string;

    if (mode === "i2v") {
      const referenceImage = String(body.referenceImage ?? "").trim();
      if (!referenceImage.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Reference image is required for production mode" },
          { status: 400 }
        );
      }

      const shotAction = String(body.shotAction ?? "").trim();
      if (!shotAction) {
        return NextResponse.json(
          { error: "Shot action is required" },
          { status: 400 }
        );
      }

      const bible = body.bible ?? {};
      fullPrompt = assembleShotPrompt(
        {
          character: String(bible.character ?? ""),
          environment: String(bible.environment ?? ""),
          look: String(bible.look ?? ""),
        },
        shotAction
      );

      const result = await submitImageToVideo({
        prompt: fullPrompt + presetConfig.suffix,
        imageSize,
        image: referenceImage,
        model: i2vModel,
        negativePrompt: NEGATIVE_PROMPT,
        seed,
      });
      requestId = result.requestId;
    } else {
      const prompt = String(body.prompt ?? "").trim();
      if (!prompt) {
        return NextResponse.json(
          { error: "Prompt is required" },
          { status: 400 }
        );
      }
      fullPrompt = `${prompt}${presetConfig.suffix}`;
      const result = await submitVideoGeneration({
        prompt: fullPrompt,
        imageSize,
        model: t2vModel,
        negativePrompt: NEGATIVE_PROMPT,
        seed,
      });
      requestId = result.requestId;
    }

    const task = await db.createTask({
      id: randomUUID(),
      requestId,
      prompt: fullPrompt,
      preset,
      mode,
      shotLabel,
      sequenceName,
      imageSize,
      status: "generating",
      siliconStatus: "InQueue",
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    const isConfig =
      message.includes("SILICONFLOW_API_KEY") ||
      message.includes("not configured");
    const isClient =
      message.includes("required") ||
      message.includes("Invalid") ||
      message.includes("Prompt");
    const status = isConfig ? 503 : isClient ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
