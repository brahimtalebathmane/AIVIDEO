export function mapGenerationError(message: string): {
  httpStatus: number;
  userMessage: string;
} {
  const lower = message.toLowerCase();

  if (
    lower.includes("balance") ||
    lower.includes("insufficient") ||
    lower.includes("quota")
  ) {
    return {
      httpStatus: 402,
      userMessage:
        "SiliconFlow balance is insufficient. Add credits at https://cloud.siliconflow.com/account/ak",
    };
  }

  if (lower.includes("model does not exist") || lower.includes("model not found")) {
    return {
      httpStatus: 400,
      userMessage:
        "That video model is not available on your SiliconFlow account. Try the Cinematic preset or set SILICONFLOW_VIDEO_MODEL in Netlify.",
    };
  }

  if (lower.includes("rate limit") || lower.includes("tpm limit")) {
    return {
      httpStatus: 429,
      userMessage: "SiliconFlow rate limit reached. Wait a moment and try again.",
    };
  }

  if (lower.includes("overloaded") || lower.includes("try again later")) {
    return {
      httpStatus: 503,
      userMessage: "SiliconFlow is overloaded. Try again in a few minutes.",
    };
  }

  if (lower.includes("invalid token") || lower.includes("unauthorized")) {
    return {
      httpStatus: 503,
      userMessage:
        "Invalid SiliconFlow API key. Check SILICONFLOW_API_KEY in Netlify environment variables.",
    };
  }

  return { httpStatus: 502, userMessage: message };
}
