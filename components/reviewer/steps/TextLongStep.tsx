"use client";

export function TextLongStep(props: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value.slice(0, 500))}
        maxLength={500}
        rows={5}
        className="w-full px-md py-sm rounded-md border border-neutral-200 bg-neutral-0 text-body resize-y"
      />
      <p className="text-caption text-neutral-700 mt-xs">
        {props.value.length}/500
      </p>
    </div>
  );
}
