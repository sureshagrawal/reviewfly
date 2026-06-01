"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { STEP_TYPE_LABELS } from "@/lib/constants/step-types";
import type { FlowStepClient } from "./FlowBuilder";

export function FlowStepCard(props: {
  step: FlowStepClient;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { step } = props;
  return (
    <Card className={step.is_active ? "" : "opacity-60"}>
      <div className="flex items-start gap-md">
        <div className="flex flex-col gap-xs">
          <Button
            size="sm"
            variant="secondary"
            onClick={props.onMoveUp}
            disabled={props.isFirst}
            aria-label="Move up"
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={props.onMoveDown}
            disabled={props.isLast}
            aria-label="Move down"
          >
            ↓
          </Button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label text-neutral-700">
            #{step.step_order + 1} · {STEP_TYPE_LABELS[step.step_type]}
            {!step.is_active && " · disabled"}
            {!step.is_required && " · optional"}
          </p>
          <p className="text-h2 text-neutral-900 truncate">{step.question_label}</p>
          {step.helper_text && (
            <p className="text-caption text-neutral-700 mt-xs truncate">
              {step.helper_text}
            </p>
          )}
          <p className="text-caption text-neutral-700 mt-sm">key: {step.step_key}</p>
        </div>
        <div className="flex flex-col gap-xs">
          <Button size="sm" onClick={props.onEdit}>Edit</Button>
          <Button size="sm" variant="danger" onClick={props.onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
