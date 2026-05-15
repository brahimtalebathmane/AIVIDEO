import type { ProductionSequence } from "./production";

const KEY = "nexus-production-sequence-v1";

export function loadSequence(): ProductionSequence | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProductionSequence;
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
