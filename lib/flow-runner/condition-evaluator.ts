/**
 * Condition evaluator for flow_steps.condition_json.
 *
 * Schema (Phase 1a — intentionally minimal):
 *   { "if": { "stepKey": "rating", "op": "gte", "value": 5 } }
 *   { "if": { "stepKey": "course", "op": "in", "value": ["JEE", "NEET"] } }
 *
 * Supported ops: equals, neq, gt, gte, lt, lte, in, contains
 *
 * Empty / null / missing condition → step always shows.
 */

export type Condition = {
  if?: {
    stepKey: string;
    op: "equals" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
    value: unknown;
  };
};

export function shouldShow(
  condition: Record<string, unknown> | null | undefined,
  responses: Record<string, unknown>,
): boolean {
  if (!condition || typeof condition !== "object") return true;
  const cond = condition as Condition;
  if (!cond.if) return true;

  const actual = responses[cond.if.stepKey];
  const expected = cond.if.value;

  switch (cond.if.op) {
    case "equals":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gt":
      return typeof actual === "number" && typeof expected === "number" && actual > expected;
    case "gte":
      return typeof actual === "number" && typeof expected === "number" && actual >= expected;
    case "lt":
      return typeof actual === "number" && typeof expected === "number" && actual < expected;
    case "lte":
      return typeof actual === "number" && typeof expected === "number" && actual <= expected;
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    case "contains":
      return Array.isArray(actual) && actual.includes(expected as never);
    default:
      return true;
  }
}
