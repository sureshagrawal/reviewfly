import { createHash } from "node:crypto";

/** SHA-256 hash a value for PII-safe logging (e.g. IP addresses). */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function classifyUA(
  userAgent: string | null,
): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(ua)) return "mobile";
  return "desktop";
}

/** Generate a URL-safe session id (40-char base36). */
export function newSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
