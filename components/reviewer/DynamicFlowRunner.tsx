"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StepType } from "@/lib/constants/step-types";
import { shouldShow } from "@/lib/flow-runner/condition-evaluator";
import { getOrCreateSessionId, storeGenerated } from "./session";
import { SingleChoiceStep } from "./steps/SingleChoiceStep";
import { MultiChoiceStep } from "./steps/MultiChoiceStep";
import { TextShortStep } from "./steps/TextShortStep";
import { TextLongStep } from "./steps/TextLongStep";
import { NumberStep } from "./steps/NumberStep";
import { RatingStep } from "./steps/RatingStep";
import { InfoPanelStep } from "./steps/InfoPanelStep";

export type FlowStepClient = {
  id: string;
  step_order: number;
  step_key: string;
  step_type: StepType;
  question_label: string;
  helper_text: string | null;
  config_json: Record<string, unknown>;
  condition_json: Record<string, unknown> | null;
  is_required: boolean;
};

type ResponseValue = string | string[] | number;
type Responses = Record<string, ResponseValue>;

export function DynamicFlowRunner(props: {
  businessId: string;
  slug: string;
  steps: FlowStepClient[];
  tagsByCategory: Record<string, Array<{ name: string; description: string | null }>>;
  brandColor: string;
}) {
  const { businessId, slug, steps, tagsByCategory, brandColor } = props;
  const router = useRouter();
  const [responses, setResponses] = useState<Responses>({});
  const [cursor, setCursor] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visible steps recomputed each render against latest responses.
  const visibleSteps = useMemo(
    () => steps.filter((s) => shouldShow(s.condition_json, responses)),
    [steps, responses],
  );

  const total = visibleSteps.length;
  const current = visibleSteps[cursor];

  const setResponse = useCallback((key: string, value: ResponseValue) => {
    // Functional updater — repeat-mistake prevention rule #1
    setResponses((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goBack = useCallback(() => {
    setCursor((c) => Math.max(0, c - 1));
  }, []);

  const isRequiredFilled = useMemo(() => {
    if (!current) return false;
    if (!current.is_required) return true;
    const v = responses[current.step_key];
    if (current.step_type === "info_panel") return true;
    if (v === undefined || v === null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "number") return Number.isFinite(v);
    return false;
  }, [current, responses]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const sessionId = getOrCreateSessionId();
      const res = await fetch("/api/v1/review/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          session_id: sessionId,
          responses,
        }),
      });
      const data = (await res.json()) as {
        review?: string;
        provider?: string;
        fallback_used?: boolean;
        error?: string;
      };
      if (!res.ok || !data.review) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      storeGenerated({
        review: data.review,
        provider: data.provider ?? "unknown",
        fallbackUsed: Boolean(data.fallback_used),
        sessionId,
        responses,
      });
      router.push(`/r/${slug}/post`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
      setSubmitting(false);
    }
  }, [businessId, responses, router, slug]);

  const goNext = useCallback(() => {
    if (cursor < total - 1) {
      setCursor((c) => c + 1);
    } else {
      void submit();
    }
  }, [cursor, total, submit]);

  if (total === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-md">
        <p className="text-body text-neutral-700">No flow configured for this business yet.</p>
      </div>
    );
  }
  if (!current) return null;

  const value = responses[current.step_key];

  return (
    <div className="flex-1 flex flex-col">
      {/* progress dots */}
      <div className="px-md pt-md flex gap-xs" aria-label={`Step ${cursor + 1} of ${total}`}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-pill ${i <= cursor ? "bg-primary" : "bg-neutral-200"}`}
          />
        ))}
      </div>

      <section className="flex-1 px-md py-lg">
        <h1 className="text-h1 text-neutral-900">{current.question_label}</h1>
        {current.helper_text && (
          <p className="text-caption text-neutral-700 mt-sm">{current.helper_text}</p>
        )}
        <div className="mt-lg">
          <StepRenderer
            step={current}
            value={value}
            onChange={(v) => setResponse(current.step_key, v)}
            tagsByCategory={tagsByCategory}
          />
        </div>
        {error && (
          <p className="mt-md text-caption text-danger" role="alert">
            {error}
          </p>
        )}
      </section>

      <footer className="bg-neutral-0 border-t border-neutral-200 px-md py-md flex gap-sm sticky bottom-0">
        <button
          type="button"
          onClick={goBack}
          disabled={cursor === 0 || submitting}
          className="min-h-touch-lg px-lg rounded-md border border-neutral-200 text-neutral-900 disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={submitting || !isRequiredFilled}
          className="min-h-touch-lg flex-1 rounded-md text-neutral-0 disabled:opacity-50"
          style={{ backgroundColor: brandColor }}
        >
          {submitting
            ? "Generating..."
            : cursor === total - 1
            ? "Generate review"
            : "Continue"}
        </button>
      </footer>
    </div>
  );
}

function StepRenderer(props: {
  step: FlowStepClient;
  value: ResponseValue | undefined;
  onChange: (v: ResponseValue) => void;
  tagsByCategory: Record<string, Array<{ name: string; description: string | null }>>;
}) {
  const { step, value, onChange, tagsByCategory } = props;
  switch (step.step_type) {
    case "single_choice":
      return (
        <SingleChoiceStep
          config={step.config_json}
          tagsByCategory={tagsByCategory}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );
    case "multi_choice":
      return (
        <MultiChoiceStep
          config={step.config_json}
          tagsByCategory={tagsByCategory}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );
    case "text_short":
      return (
        <TextShortStep
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );
    case "text_long":
      return (
        <TextLongStep
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );
    case "number":
      return (
        <NumberStep
          value={typeof value === "number" ? value : undefined}
          onChange={onChange}
        />
      );
    case "rating":
      return (
        <RatingStep
          value={typeof value === "number" ? value : 5}
          onChange={onChange}
        />
      );
    case "info_panel":
      return <InfoPanelStep config={step.config_json} />;
    default:
      return null;
  }
}
