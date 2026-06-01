import { describe, it, expect } from "vitest";

/**
 * Phase 0 smoke test — verifies the test harness itself works.
 * Real integration tests for health endpoint added once `pnpm install`
 * provides @types/node and vitest can resolve all imports.
 */
describe("phase-0 smoke", () => {
  it("test runner is wired up", () => {
    expect(1 + 1).toBe(2);
  });
});
