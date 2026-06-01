"use client";

export function InfoPanelStep(props: { config: Record<string, unknown> }) {
  const body = (props.config.body as string | undefined) ?? "";
  return (
    <div className="rounded-md bg-primary-soft p-md">
      <p className="text-body text-neutral-900 whitespace-pre-line">{body}</p>
    </div>
  );
}
