"use client";

export function NumberStep(props: {
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={props.value ?? ""}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) props.onChange(n);
      }}
      className="w-full min-h-touch-lg px-md rounded-md border border-neutral-200 bg-neutral-0 text-body"
      inputMode="decimal"
    />
  );
}
