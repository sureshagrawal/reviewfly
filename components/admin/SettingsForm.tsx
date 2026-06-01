"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input, TextArea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export type SettingsFormValues = {
  display_name: string;
  brand_color: string;
  google_review_url: string | null;
  whatsapp_number: string | null;
  poster_tagline: string | null;
  ai_enabled: boolean;
  sentiment_gate_threshold: number;
  hard_fallback: string;
};

export function SettingsForm({ initial }: { initial: SettingsFormValues }) {
  const toast = useToast();
  const [form, setForm] = useState<SettingsFormValues>(initial);
  const [saving, setSaving] = useState(false);

  // Functional setter — repeat-mistake rule #1
  const update = <K extends keyof SettingsFormValues>(
    key: K,
    value: SettingsFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.show(data.error ?? "save failed", "error");
        setSaving(false);
        return;
      }
      toast.show("settings saved", "success");
    } catch {
      toast.show("network error", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-md">
      <Card title="Branding">
        <div className="flex flex-col gap-md">
          <Input
            label="Display name"
            value={form.display_name}
            onChange={(e) => update("display_name", e.target.value)}
            required
          />
          <Input
            label="Brand color"
            type="text"
            value={form.brand_color}
            onChange={(e) => update("brand_color", e.target.value)}
            hint="Hex like #1a73e8"
            required
          />
          <Input
            label="Poster tagline (optional)"
            value={form.poster_tagline ?? ""}
            onChange={(e) => update("poster_tagline", e.target.value || null)}
          />
        </div>
      </Card>

      <Card title="Integrations">
        <div className="flex flex-col gap-md">
          <Input
            label="Google review URL"
            value={form.google_review_url ?? ""}
            onChange={(e) =>
              update("google_review_url", e.target.value || null)
            }
            hint="Paste your business 'leave a review' link here"
          />
          <Input
            label="WhatsApp number (with country code)"
            value={form.whatsapp_number ?? ""}
            onChange={(e) =>
              update("whatsapp_number", e.target.value || null)
            }
            placeholder="+919999999999"
          />
        </div>
      </Card>

      <Card title="Review generation">
        <div className="flex flex-col gap-md">
          <label className="flex items-center gap-sm">
            <input
              type="checkbox"
              checked={form.ai_enabled}
              onChange={(e) => update("ai_enabled", e.target.checked)}
              className="h-5 w-5"
            />
            <span className="text-body text-neutral-900">AI generation enabled</span>
          </label>
          <Input
            label="Sentiment gate threshold"
            type="number"
            step="0.05"
            min={0}
            max={1}
            value={form.sentiment_gate_threshold}
            onChange={(e) =>
              update("sentiment_gate_threshold", Number(e.target.value))
            }
            hint="0 - 1; reviews below threshold go to WhatsApp instead of Google"
          />
          <TextArea
            label="Fallback text"
            value={form.hard_fallback}
            onChange={(e) => update("hard_fallback", e.target.value)}
            hint="Used if AI fails completely"
            required
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
