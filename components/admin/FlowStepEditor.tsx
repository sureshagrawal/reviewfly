"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { STEP_TYPES, STEP_TYPE_LABELS, type StepType } from "@/lib/constants/step-types";
import { adminFetch } from "./adminFetch";
import type { FlowStepClient } from "./FlowBuilder";

type ConditionOp =
  | "equals"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "contains";

type FormState = {
  step_key: string;
  step_type: StepType;
  question_label: string;
  helper_text: string;
  is_required: boolean;
  inject_into_prompt: boolean;
  // step-type specific
  options_source: "inline" | "business_tags";
  category: string;
  inline_options: string;
  max_picks: number;
  body: string;
  scale: number; // for rating
  // conditional show
  cond_enabled: boolean;
  cond_step_key: string;
  cond_op: ConditionOp;
  cond_value: string;
};

function deriveKey(label: string, existing: string): string {
  if (existing) return existing;
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50)
    .replace(/^[^a-z]+/, "x") || "step";
}

function fromStep(s: FlowStepClient | null): FormState {
  if (!s) {
    return {
      step_key: "",
      step_type: "rating",
      question_label: "",
      helper_text: "",
      is_required: true,
      inject_into_prompt: true,
      options_source: "business_tags",
      category: "",
      inline_options: "",
      max_picks: 2,
      body: "",
      scale: 5,
      cond_enabled: false,
      cond_step_key: "",
      cond_op: "equals",
      cond_value: "",
    };
  }
  const c = s.config_json;
  const cond = s.condition_json as
    | { if?: { stepKey: string; op: ConditionOp; value: unknown } }
    | null;
  return {
    step_key: s.step_key,
    step_type: s.step_type,
    question_label: s.question_label,
    helper_text: s.helper_text ?? "",
    is_required: s.is_required,
    inject_into_prompt: s.inject_into_prompt,
    options_source: (c.options_source as "inline" | "business_tags" | undefined) ?? "business_tags",
    category: (c.category as string | undefined) ?? "",
    inline_options: Array.isArray(c.options)
      ? (c.options as Array<{ name: string; description?: string | null }>)
          .map((o) =>
            o.description ? `${o.name} | ${o.description}` : o.name,
          )
          .join("\n")
      : "",
    max_picks: (c.max_picks as number | undefined) ?? 2,
    body: (c.body as string | undefined) ?? "",
    scale: (c.scale as number | undefined) ?? 5,
    cond_enabled: !!cond?.if,
    cond_step_key: cond?.if?.stepKey ?? "",
    cond_op: (cond?.if?.op as ConditionOp | undefined) ?? "equals",
    cond_value: cond?.if ? formatCondValue(cond.if.value) : "",
  };
}

function formatCondValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
}

function parseCondValue(op: ConditionOp, raw: string): unknown {
  if (op === "in") return raw.split(",").map((x) => x.trim()).filter(Boolean);
  if (["gt", "gte", "lt", "lte"].includes(op)) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  return raw;
}

function parseInlineOptions(text: string): Array<{ name: string; description?: string }> {
  return text
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) => {
      const pipeIdx = line.indexOf("|");
      if (pipeIdx === -1) return { name: line };
      const name = line.slice(0, pipeIdx).trim();
      const description = line.slice(pipeIdx + 1).trim();
      if (!name) return { name: line };
      return description ? { name, description } : { name };
    });
}

function buildConfigJson(f: FormState): Record<string, unknown> {
  switch (f.step_type) {
    case "single_choice":
    case "multi_choice":
      if (f.options_source === "business_tags") {
        const cfg: Record<string, unknown> = {
          options_source: "business_tags",
          category: f.category,
        };
        if (f.step_type === "multi_choice") cfg.max_picks = f.max_picks;
        return cfg;
      }
      return {
        options_source: "inline",
        options: parseInlineOptions(f.inline_options),
        ...(f.step_type === "multi_choice" ? { max_picks: f.max_picks } : {}),
      };
    case "info_panel":
      return { body: f.body };
    case "rating":
      return { scale: f.scale };
    default:
      return {};
  }
}

function buildConditionJson(
  f: FormState,
): Record<string, unknown> | null {
  if (!f.cond_enabled || !f.cond_step_key) return null;
  return {
    if: {
      stepKey: f.cond_step_key,
      op: f.cond_op,
      value: parseCondValue(f.cond_op, f.cond_value),
    },
  };
}

export function FlowStepEditor(props: {
  step: FlowStepClient | null;
  isCreating: boolean;
  categories: string[];
  allSteps: Array<{ id: string; step_key: string; question_label: string }>;
  onClose: (saved: boolean) => void | Promise<void>;
}) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(fromStep(props.step));
  const [saving, setSaving] = useState(false);

  // Functional updater — repeat-mistake rule #1
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onLabelBlur = () => {
    if (!form.step_key && form.question_label) {
      update("step_key", deriveKey(form.question_label, form.step_key));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        step_key: form.step_key,
        step_type: form.step_type,
        question_label: form.question_label,
        helper_text: form.helper_text || null,
        config_json: buildConfigJson(form),
        condition_json: buildConditionJson(form),
        is_required: form.is_required,
        inject_into_prompt: form.inject_into_prompt,
      };
      const url = props.isCreating
        ? "/api/v1/admin/flow/steps"
        : `/api/v1/admin/flow/steps/${props.step!.id}`;
      const method = props.isCreating ? "POST" : "PUT";
      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.show(data.error ?? "save failed", "error");
        setSaving(false);
        return;
      }
      toast.show(props.isCreating ? "step added" : "step updated", "success");
      await props.onClose(true);
    } catch {
      toast.show("network error", "error");
      setSaving(false);
    }
  };

  const needsOptions =
    form.step_type === "single_choice" || form.step_type === "multi_choice";

  return (
    <div
      className="fixed inset-0 z-40 bg-neutral-900/40 flex items-stretch justify-end"
      role="dialog"
      aria-modal="true"
      onClick={() => void props.onClose(false)}
    >
      <div
        className="bg-neutral-0 w-full max-w-[36rem] h-full overflow-y-auto p-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-md">
          <h2 className="text-h1 text-neutral-900">
            {props.isCreating ? "Add step" : "Edit step"}
          </h2>
          <Button variant="ghost" onClick={() => void props.onClose(false)}>
            ✕
          </Button>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-md">
          <Card>
            <div className="flex flex-col gap-md">
              <label className="text-label text-neutral-700">
                Step type
                <select
                  value={form.step_type}
                  onChange={(e) => update("step_type", e.target.value as StepType)}
                  className="mt-xs w-full min-h-touch px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
                >
                  {STEP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {STEP_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                label="Question label"
                value={form.question_label}
                onChange={(e) => update("question_label", e.target.value)}
                onBlur={onLabelBlur}
                hint="Tip: use {step_key} to insert a previous answer, e.g. 'Rate your {course} experience'."
                required
              />
              <Input
                label="Helper text (optional)"
                value={form.helper_text}
                onChange={(e) => update("helper_text", e.target.value)}
                hint="Supports {step_key} too."
              />
              <Input
                label="Step key (advanced)"
                value={form.step_key}
                onChange={(e) =>
                  update(
                    "step_key",
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  )
                }
                hint="lowercase letters, digits, underscore. Auto-derived from label."
                required
              />
            </div>
          </Card>

          {needsOptions && (
            <Card title="Options">
              <div className="flex flex-col gap-md">
                <label className="text-label text-neutral-700">
                  Options source
                  <select
                    value={form.options_source}
                    onChange={(e) =>
                      update("options_source", e.target.value as "inline" | "business_tags")
                    }
                    className="mt-xs w-full min-h-touch px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
                  >
                    <option value="business_tags">From tag library</option>
                    <option value="inline">Inline list</option>
                  </select>
                </label>

                {form.options_source === "business_tags" ? (
                  <label className="text-label text-neutral-700">
                    Tag category
                    <select
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                      className="mt-xs w-full min-h-touch px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
                    >
                      <option value="">— pick a category —</option>
                      {props.categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <TextArea
                    label="Options (one per line)"
                    value={form.inline_options}
                    onChange={(e) => update("inline_options", e.target.value)}
                    rows={5}
                    hint="Format: Name | Description (description optional). Example: 'I am a Student | I study here'"
                  />
                )}

                {form.step_type === "multi_choice" && (
                  <Input
                    type="number"
                    label="Max picks"
                    min={1}
                    max={10}
                    value={form.max_picks}
                    onChange={(e) => update("max_picks", Math.max(1, Number(e.target.value)))}
                  />
                )}
              </div>
            </Card>
          )}

          {form.step_type === "info_panel" && (
            <Card title="Content">
              <TextArea
                label="Body"
                value={form.body}
                onChange={(e) => update("body", e.target.value)}
                rows={6}
                hint="Shown as plain text inside a card. Supports {step_key} interpolation."
              />
            </Card>
          )}

          {form.step_type === "rating" && (
            <Card title="Rating scale">
              <label className="text-label text-neutral-700">
                Scale
                <select
                  value={form.scale}
                  onChange={(e) => update("scale", Number(e.target.value))}
                  className="mt-xs w-full min-h-touch px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
                >
                  <option value={3}>3 stars</option>
                  <option value={5}>5 stars</option>
                  <option value={10}>10 stars</option>
                </select>
              </label>
            </Card>
          )}

          <Card title="When to show (optional)">
            <div className="flex flex-col gap-md">
              <label className="flex items-center gap-sm">
                <input
                  type="checkbox"
                  checked={form.cond_enabled}
                  onChange={(e) => update("cond_enabled", e.target.checked)}
                  className="h-5 w-5"
                />
                <span className="text-body text-neutral-900">
                  Only show this step when a previous answer matches
                </span>
              </label>
              {form.cond_enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
                  <label className="text-label text-neutral-700">
                    Previous step
                    <select
                      value={form.cond_step_key}
                      onChange={(e) => update("cond_step_key", e.target.value)}
                      className="mt-xs w-full min-h-touch px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
                    >
                      <option value="">— pick a step —</option>
                      {props.allSteps
                        .filter((s) => !props.step || s.id !== props.step.id)
                        .map((s) => (
                          <option key={s.id} value={s.step_key}>
                            {s.step_key} · {s.question_label.slice(0, 40)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="text-label text-neutral-700">
                    Operator
                    <select
                      value={form.cond_op}
                      onChange={(e) => update("cond_op", e.target.value as ConditionOp)}
                      className="mt-xs w-full min-h-touch px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
                    >
                      <option value="equals">equals</option>
                      <option value="neq">not equals</option>
                      <option value="gt">greater than</option>
                      <option value="gte">at least</option>
                      <option value="lt">less than</option>
                      <option value="lte">at most</option>
                      <option value="in">is one of</option>
                      <option value="contains">contains</option>
                    </select>
                  </label>
                  <Input
                    label="Value"
                    value={form.cond_value}
                    onChange={(e) => update("cond_value", e.target.value)}
                    hint={
                      form.cond_op === "in"
                        ? "comma-separated list"
                        : "single value"
                    }
                  />
                </div>
              )}
            </div>
          </Card>

          <Card title="Behavior">
            <div className="flex flex-col gap-sm">
              <label className="flex items-center gap-sm">
                <input
                  type="checkbox"
                  checked={form.is_required}
                  onChange={(e) => update("is_required", e.target.checked)}
                  className="h-5 w-5"
                />
                <span className="text-body text-neutral-900">Required</span>
              </label>
              <label className="flex items-center gap-sm">
                <input
                  type="checkbox"
                  checked={form.inject_into_prompt}
                  onChange={(e) => update("inject_into_prompt", e.target.checked)}
                  className="h-5 w-5"
                />
                <span className="text-body text-neutral-900">Include in AI prompt</span>
              </label>
            </div>
          </Card>

          <div className="flex justify-end gap-sm pt-md">
            <Button type="button" variant="ghost" onClick={() => void props.onClose(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {props.isCreating ? "Add step" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
