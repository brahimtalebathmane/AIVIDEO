import type { ProductionSequence } from "./production";

const KEY = "nexus-production-sequence-v1";

export function loadSequence(): ProductionSequence | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductionSequence & {
      referenceImage?: string | null;
    };
    if (!parsed?.bible || !Array.isArray(parsed.shots)) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { referenceImage, ...sequence } = parsed;
    void referenceImage;
    return sequence as ProductionSequence;
  } catch {
    return null;
  }
}

export function saveSequence(sequence: ProductionSequence): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(sequence));
  } catch {
    /* quota — reference image too large */
  }
}

export function clearSequence(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
