"use client";

import { interpolate } from "@/lib/flow-runner/template";

export function InfoPanelStep(props: {
  config: Record<string, unknown>;
  responses?: Record<string, unknown>;
}) {
  const body = (props.config.body as string | undefined) ?? "";
  const text = props.responses ? interpolate(body, props.responses) : body;
  return (
    <div className="rounded-md bg-primary-soft p-md">
      <p className="text-body text-neutral-900 whitespace-pre-line">{text}</p>
    </div>
  );
}
