/**
 * Step type constants — single source of truth.
 *
 * When adding a new step type, update:
 *   1. This array
 *   2. lib/flow-runner/step-registry.ts
 *   3. components/reviewer/steps/<NewType>Step.tsx
 *   4. Engine prompt builder if step is `injectIntoPrompt`-eligible
 */

export const STEP_TYPES = [
  "single_choice",
  "multi_choice",
  "text_short",
  "text_long",
  "number",
  "rating",
  "info_panel",
] as const;

export type StepType = (typeof STEP_TYPES)[number];

export const STEP_TYPE_LABELS: Record<StepType, string> = {
  single_choice: "Single choice",
  multi_choice: "Multiple choice",
  text_short: "Short text",
  text_long: "Long text",
  number: "Number",
  rating: "Star rating",
  info_panel: "Info panel",
};

/**
 * Uniqueness engine dimensions (per SRS §16).
 * Each dimension is sampled independently from prompt_pools, then merged
 * into the final prompt skeleton.
 */
export const ENGINE_DIMENSIONS = [
  "opening",
  "tone",
  "language",
  "emoji",
  "structure",
  "grammar",
  "staff_mention",
  "length",
] as const;

export type EngineDimension = (typeof ENGINE_DIMENSIONS)[number];

/**
 * Event types written to review_events.
 */
export const REVIEW_EVENT_TYPES = [
  "scan",
  "step_started",
  "step_completed",
  "ai_generated",
  "fallback_used",
  "review_edited",
  "sentiment_scored",
  "post_on_google_clicked",
  "negative_feedback",
] as const;

export type ReviewEventType = (typeof REVIEW_EVENT_TYPES)[number];
