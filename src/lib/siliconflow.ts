const SILICONFLOW_BASE = "https://api.siliconflow.com/v1";
/** Wan2.2 — highest quality; slower than Turbo */
export const VIDEO_MODEL =
  process.env.SILICONFLOW_VIDEO_MODEL ?? "Wan-AI/Wan2.2-T2V-A14B";

export const I2V_MODEL =
  process.env.SILICONFLOW_I2V_MODEL ?? "Wan-AI/Wan2.2-I2V-A14B";

export const TURBO_T2V_MODEL =
  process.env.SILICONFLOW_TURBO_T2V_MODEL ??
  "Wan-AI/Wan2.1-T2V-14B-720P-Turbo";

export const TURBO_I2V_MODEL =
  process.env.SILICONFLOW_TURBO_I2V_MODEL ??
  "Wan-AI/Wan2.1-I2V-14B-720P-Turbo";

export type SiliconVideoStatus =
  | "Succeed"
  | "InQueue"
  | "InProgress"
  | "Failed";

export interface SubmitVideoResponse {
  requestId: string;
}

export interface VideoStatusResponse {
  status: SiliconVideoStatus;
  reason?: string;
  results?: {
    videos?: { url: string }[];
    timings?: { inference?: number };
    seed?: number;
  };
}

function getApiKey(): string {
  const key = process.env.SILICONFLOW_API_KEY;
  if (!key) {
    throw new Error("SILICONFLOW_API_KEY is not configured");
  }
  return key;
}

async function siliconFetch<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${SILICONFLOW_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : `SiliconFlow API error (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function submitVideoGeneration(params: {
  prompt: string;
  imageSize: string;
  model?: string;
  negativePrompt?: string;
  seed?: number;
}): Promise<SubmitVideoResponse> {
  return siliconFetch<SubmitVideoResponse>("/video/submit", {
    model: params.model ?? VIDEO_MODEL,
    prompt: params.prompt,
    image_size: params.imageSize,
    ...(params.negativePrompt && {
      negative_prompt: params.negativePrompt,
    }),
    ...(params.seed != null && { seed: params.seed }),
  });
}

export async function submitImageToVideo(params: {
  prompt: string;
  imageSize: string;
  image: string;
  model?: string;
  negativePrompt?: string;
  seed?: number;
}): Promise<SubmitVideoResponse> {
  return siliconFetch<SubmitVideoResponse>("/video/submit", {
    model: params.model ?? I2V_MODEL,
    prompt: params.prompt,
    image_size: params.imageSize,
    image: params.image,
    ...(params.negativePrompt && {
      negative_prompt: params.negativePrompt,
    }),
    ...(params.seed != null && { seed: params.seed }),
  });
}

export async function getVideoStatus(
  requestId: string
): Promise<VideoStatusResponse> {
  return siliconFetch<VideoStatusResponse>("/video/status", { requestId });
}

/**
 * Best-effort remote cancel. SiliconFlow may not expose this endpoint;
 * local task cancellation still stops polling and UI work immediately.
 */
export async function cancelVideoGeneration(
  requestId: string
): Promise<boolean> {
  try {
    await siliconFetch<{ ok?: boolean }>("/video/cancel", { requestId });
    return true;
  } catch {
    return false;
  }
}

export function mapSiliconStatusToTask(
  status: SiliconVideoStatus
): "generating" | "ready" | "failed" | "queued" {
  switch (status) {
    case "Succeed":
      return "ready";
    case "Failed":
      return "failed";
    case "InQueue":
      return "queued";
    case "InProgress":
    default:
      return "generating";
  }
}
