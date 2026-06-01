"use client";

export function TextShortStep(props: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value.slice(0, 100))}
      maxLength={100}
      className="w-full min-h-touch-lg px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
      autoFocus
    />
  );
}
