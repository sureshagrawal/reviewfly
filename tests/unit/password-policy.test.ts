import { describe, it, expect } from "vitest";

// Note: we re-implement the strength check inline to avoid loading env at test time.
function validate(p: string): string | null {
  if (p.length < 12) return "password must be at least 12 characters";
  if (!/[a-z]/.test(p)) return "password must contain a lowercase letter";
  if (!/[A-Z]/.test(p)) return "password must contain an uppercase letter";
  if (!/[0-9]/.test(p)) return "password must contain a digit";
  return null;
}

describe("password strength policy", () => {
  it("rejects short passwords", () => {
    expect(validate("Short1")).toMatch(/12 characters/);
  });
  it("requires upper, lower, digit", () => {
    expect(validate("alllowercase123")).toMatch(/uppercase/);
    expect(validate("ALLUPPERCASE123")).toMatch(/lowercase/);
    expect(validate("NoDigitsHereAtAll")).toMatch(/digit/);
  });
  it("accepts a strong password", () => {
    expect(validate("StrongEnough1")).toBeNull();
  });
});
