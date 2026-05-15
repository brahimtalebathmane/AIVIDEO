import { detectImageSize, type ImageSize } from "./production";

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.88;

export async function fileToReferenceDataUrl(
  file: File
): Promise<{ dataUrl: string; imageSize: ImageSize }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const imageSize = detectImageSize(w, h);
  return { dataUrl, imageSize };
}
