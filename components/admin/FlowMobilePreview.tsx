"use client";

import { useMemo, useState } from "react";
import type { FlowStepClient } from "./FlowBuilder";
import { shouldShow } from "@/lib/flow-runner/condition-evaluator";
import { interpolate } from "@/lib/flow-runner/template";

/**
 * Read-only mobile-frame preview of the current draft flow.
 *
 * Simulates the reviewer experience without calling /api/v1/review/generate.
 * Same visual treatment as DynamicFlowRunner.
 */
export function FlowMobilePreview(props: {
  steps: FlowStepClient[];
  tagsByCategory: Record<string, Array<{ name: string }>>;
}) {
  const activeSteps = useMemo(
    () => props.steps.filter((s) => s.is_active),
    [props.steps],
  );
  const [cursor, setCursor] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});

  const visible = useMemo(
    () => activeSteps.filter((s) => shouldShow(s.condition_json, responses)),
    [activeSteps, responses],
  );
  const current = visible[Math.min(cursor, visible.length - 1)];

  const set = (key: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const goNext = () => setCursor((c) => Math.min(c + 1, visible.length - 1));
  const goBack = () => setCursor((c) => Math.max(0, c - 1));

  const reset = () => {
    setCursor(0);
    setResponses({});
  };

  if (visible.length === 0) {
    return (
      <div className="w-[320px] h-[640px] rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center mx-auto">
        <p className="text-caption text-neutral-700 text-center px-md">
          Add an active step to see the preview
        </p>
      </div>
    );
  }

  return (
    <div className="w-[320px] mx-auto">
      <div className="rounded-xl border border-neutral-900 bg-neutral-0 overflow-hidden shadow-lg">
        <div className="bg-neutral-0 border-b border-neutral-200 px-md py-sm text-label text-neutral-700">
          Reviewer
        </div>
        <div className="px-md py-sm flex gap-xs">
          {visible.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-pill ${
                i <= cursor ? "bg-primary" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>
        <section className="px-md py-md min-h-[420px]">
          {current && (
            <>
              <h3 className="text-h2 text-neutral-900">
                {interpolate(current.question_label, responses)}
              </h3>
              {current.helper_text && (
                <p className="text-caption text-neutral-700 mt-xs">
                  {interpolate(current.helper_text, responses)}
                </p>
              )}
              <div className="mt-md">
                <PreviewStepBody
                  step={current}
                  value={responses[current.step_key]}
                  onChange={(v) => set(current.step_key, v)}
                  tagsByCategory={props.tagsByCategory}
                  responses={responses}
                />
              </div>
            </>
          )}
        </section>
        <footer className="px-md py-sm border-t border-neutral-200 flex gap-xs">
          <button
            type="button"
            onClick={goBack}
            disabled={cursor === 0}
            className="min-h-touch px-md rounded-md border border-neutral-200 text-caption disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={cursor >= visible.length - 1}
            className="min-h-touch flex-1 rounded-md bg-primary text-neutral-0 text-caption disabled:opacity-40"
          >
            Continue
          </button>
        </footer>
      </div>
      <div className="mt-sm flex justify-center">
        <button
          type="button"
          onClick={reset}
          className="text-caption text-neutral-700 underline"
        >
          Reset preview
        </button>
      </div>
    </div>
  );
}

function PreviewStepBody(props: {
  step: FlowStepClient;
  value: unknown;
  onChange: (v: unknown) => void;
  tagsByCategory: Record<string, Array<{ name: string; description?: string | null }>>;
  responses: Record<string, unknown>;
}) {
  const { step, value, onChange, tagsByCategory, responses } = props;
  switch (step.step_type) {
    case "rating": {
      const max = Math.max(2, Math.min(10, (step.config_json.scale as number | undefined) ?? 5));
      const v = typeof value === "number" ? value : max;
      return (
        <div className="flex justify-center gap-xs flex-wrap">
          {Array.from({ length: max }, (_, i) => i + 1).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              data-star={s <= v ? "on" : "off"}
              className="text-4xl leading-none p-xs"
            >
              ★
            </button>
          ))}
        </div>
      );
    }
    case "single_choice":
    case "multi_choice": {
      const opts = resolveOptions(step.config_json, tagsByCategory);
      const isMulti = step.step_type === "multi_choice";
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const single = typeof value === "string" ? value : "";
      const maxPicks = (step.config_json.max_picks as number | undefined) ?? 10;
      return (
        <div className="flex flex-col gap-sm">
          {opts.length === 0 && (
            <p className="text-caption text-neutral-700">No options yet.</p>
          )}
          {opts.map((o) => {
            const selected = isMulti ? arr.includes(o.name) : single === o.name;
            return (
              <button
                key={o.name}
                type="button"
                onClick={() => {
                  if (isMulti) {
                    if (selected) onChange(arr.filter((x) => x !== o.name));
                    else if (arr.length < maxPicks) onChange([...arr, o.name]);
                  } else {
                    onChange(o.name);
                  }
                }}
                className={`min-h-touch w-full text-left px-md py-xs rounded-md border ${
                  selected
                    ? "bg-primary-soft border-primary"
                    : "bg-neutral-0 border-neutral-200"
                }`}
              >
                <span className="text-body text-neutral-900">
                  {selected ? "✓ " : ""}
                  {o.name}
                </span>
                {o.description && (
                  <span className="block text-caption text-neutral-700 mt-xs">
                    {o.description}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      );
    }
    case "text_short":
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value.slice(0, 100))}
          maxLength={100}
          className="w-full min-h-touch px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
        />
      );
    case "text_long":
      return (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value.slice(0, 500))}
          maxLength={500}
          rows={4}
          className="w-full px-md py-xs rounded-md border border-neutral-200 bg-neutral-0 text-body resize-y"
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
          className="w-full min-h-touch px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
          inputMode="decimal"
        />
      );
    case "info_panel":
      return (
        <div className="rounded-md bg-primary-soft p-md">
          <p className="text-body text-neutral-900 whitespace-pre-line">
            {interpolate((step.config_json.body as string) ?? "", responses)}
          </p>
        </div>
      );
    default:
      return null;
  }
}

function resolveOptions(
  config: Record<string, unknown>,
  tagsByCategory: Record<string, Array<{ name: string; description?: string | null }>>,
): Array<{ name: string; description: string | null }> {
  const src = (config.options_source as string | undefined) ?? "inline";
  if (src === "business_tags") {
    const cat = (config.category as string | undefined) ?? "";
    return (tagsByCategory[cat] ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? null,
    }));
  }
  const inline =
    (config.options as Array<{ name: string; description?: string | null }> | undefined) ?? [];
  return inline.map((o) => ({ name: o.name, description: o.description ?? null }));
}
