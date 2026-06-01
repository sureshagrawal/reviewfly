"use client";

export function RatingStep(props: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex justify-center gap-sm">
      {[1, 2, 3, 4, 5].map((star) => (
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
