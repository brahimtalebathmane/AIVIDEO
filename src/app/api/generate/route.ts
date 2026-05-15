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
import { mapGenerationError } from "@/lib/api-errors";
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

    if (mode === "production" || mode === "i2v") {
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

      const referenceImage = String(body.referenceImage ?? "").trim();
      const useImage =
        mode === "i2v" && referenceImage.startsWith("data:image/");

      if (useImage) {
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
        if (mode === "i2v") {
          return NextResponse.json(
            {
              error:
                "Reference image is required for I2V mode. Use production mode for text-only sequences.",
            },
            { status: 400 }
          );
        }
        const result = await submitVideoGeneration({
          prompt: fullPrompt + presetConfig.suffix,
          imageSize,
          model: t2vModel,
          negativePrompt: NEGATIVE_PROMPT,
          seed,
        });
        requestId = result.requestId;
      }
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
    const raw =
      error instanceof Error ? error.message : "Generation failed";
    const isConfig =
      raw.includes("SILICONFLOW_API_KEY") || raw.includes("not configured");
    if (isConfig) {
      return NextResponse.json(
        {
          error:
            "Server is missing SILICONFLOW_API_KEY. Add it in Netlify → Site settings → Environment variables.",
        },
        { status: 503 }
      );
    }
    const isClient =
      raw.includes("required") ||
      raw.includes("Invalid quality") ||
      raw.includes("Prompt is required") ||
      raw.includes("Reference image");
    if (isClient) {
      return NextResponse.json({ error: raw }, { status: 400 });
    }
    const { httpStatus, userMessage } = mapGenerationError(raw);
    return NextResponse.json({ error: userMessage }, { status: httpStatus });
  }
}
