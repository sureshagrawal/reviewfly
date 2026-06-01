/**
 * Tiny session storage helpers used by the reviewer flow.
 *
 * - sessionId persists for the tab so /r and /r/post share it.
 * - Generated review + session_id are handed off via sessionStorage to /post.
 *   (Not localStorage — we don't want it to outlive the tab.)
 */

const SESSION_KEY = "rf_session_id";
const REVIEW_KEY = "rf_generated_review";

function makeId(): string {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr-placeholder";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = makeId();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export type GeneratedHandoff = {
  review: string;
  provider: string;
  fallbackUsed: boolean;
  sessionId: string;
  responses: Record<string, unknown>;
};

export function storeGenerated(handoff: GeneratedHandoff): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REVIEW_KEY, JSON.stringify(handoff));
}

export function readGenerated(): GeneratedHandoff | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(REVIEW_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GeneratedHandoff;
  } catch {
    return null;
  }
}

export function clearGenerated(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REVIEW_KEY);
}
