"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StepType } from "@/lib/constants/step-types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "./adminFetch";
import { FlowStepCard } from "./FlowStepCard";
import { FlowStepEditor } from "./FlowStepEditor";
import { FlowMobilePreview } from "./FlowMobilePreview";

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
  inject_into_prompt: boolean;
  is_active: boolean;
};

export function FlowBuilder(props: {
  initialSteps: FlowStepClient[];
  tagsByCategory: Record<string, Array<{ name: string; description?: string | null }>>;
  categories: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [steps, setSteps] = useState<FlowStepClient[]>(
    [...props.initialSteps].sort((a, b) => a.step_order - b.step_order),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const editingStep = useMemo(
    () => steps.find((s) => s.id === editingId) ?? null,
    [steps, editingId],
  );

  const refresh = useCallback(async () => {
    const res = await adminFetch("/api/v1/admin/flow");
    if (!res.ok) return;
    const data = (await res.json()) as { steps: FlowStepClient[] };
    setSteps([...data.steps].sort((a, b) => a.step_order - b.step_order));
    setOrderDirty(false);
  }, []);

  const moveUp = useCallback((id: string) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
      setOrderDirty(true);
      return next;
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
      setOrderDirty(true);
      return next;
    });
  }, []);

  const saveOrder = useCallback(async () => {
    setSavingOrder(true);
    try {
      const res = await adminFetch("/api/v1/admin/flow/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordered_ids: steps.map((s) => s.id) }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.show(data.error ?? "reorder failed", "error");
        return;
      }
      toast.show("order saved", "success");
      setOrderDirty(false);
      await refresh();
      router.refresh();
    } catch {
      toast.show("network error", "error");
    } finally {
      setSavingOrder(false);
    }
  }, [steps, refresh, router, toast]);

  const removeStep = useCallback(
    async (id: string) => {
      const confirmed = window.confirm("Delete this step?");
      if (!confirmed) return;
      const res = await adminFetch(`/api/v1/admin/flow/steps/${id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.show(data.error ?? "delete failed", "error");
        return;
      }
      toast.show("step deleted", "success");
      setSteps((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    },
    [router, toast],
  );

  const closeEditor = useCallback(async (saved: boolean) => {
    setEditingId(null);
    setIsCreating(false);
    if (saved) await refresh();
  }, [refresh]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-lg">
      <div className="flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-neutral-900">Steps ({steps.length})</h2>
          <div className="flex gap-sm">
            {orderDirty && (
              <Button onClick={() => void saveOrder()} loading={savingOrder} size="md">
                Save new order
              </Button>
            )}
            <Button onClick={() => setIsCreating(true)} size="md">
              + Add step
            </Button>
          </div>
        </div>

        {steps.length === 0 && (
          <Card>
            <p className="text-body text-neutral-700">
              No steps yet. Click <strong>+ Add step</strong> to create your first one.
            </p>
          </Card>
        )}

        {steps.map((s, idx) => (
          <FlowStepCard
            key={s.id}
            step={s}
            isFirst={idx === 0}
            isLast={idx === steps.length - 1}
            onEdit={() => setEditingId(s.id)}
            onDelete={() => void removeStep(s.id)}
            onMoveUp={() => moveUp(s.id)}
            onMoveDown={() => moveDown(s.id)}
          />
        ))}
      </div>

      <aside className="lg:sticky lg:top-md self-start">
        <p className="text-label text-neutral-700 mb-sm">Mobile preview</p>
        <FlowMobilePreview steps={steps} tagsByCategory={props.tagsByCategory} />
      </aside>

      {(editingId || isCreating) && (
        <FlowStepEditor
          step={editingStep}
          isCreating={isCreating}
          categories={props.categories}
          allSteps={steps.map((s) => ({
            id: s.id,
            step_key: s.step_key,
            question_label: s.question_label,
          }))}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}
