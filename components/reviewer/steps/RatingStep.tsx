"use client";

export function RatingStep(props: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const max = Math.max(2, Math.min(10, props.max ?? 5));
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="flex justify-center gap-sm flex-wrap">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => props.onChange(star)}
          className="text-5xl leading-none p-xs min-h-touch-lg min-w-touch-lg"
          style={{ color: star <= props.value ? "#f29900" : "#e8eaed" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
