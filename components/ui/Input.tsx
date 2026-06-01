"use client";

import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  forwardRef,
  useId,
} from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }
>(function Input({ label, hint, error, className, id, ...rest }, ref) {
  // useId is SSR-safe (same id on server and client) — no hydration mismatch.
  const autoId = useId();
  const generatedId = id ?? autoId;
  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label htmlFor={generatedId} className="text-label text-neutral-700">
          {label}
        </label>
      )}
      <input
        id={generatedId}
        ref={ref}
        className={`min-h-touch px-md rounded-md border border-neutral-200 bg-neutral-0 text-body w-full focus:border-primary ${error ? "border-danger" : ""} ${className ?? ""}`}
        {...rest}
      />
      {error ? (
        <p className="text-caption text-danger">{error}</p>
      ) : hint ? (
        <p className="text-caption text-neutral-700">{hint}</p>
      ) : null}
    </div>
  );
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }
>(function TextArea({ label, hint, error, className, id, ...rest }, ref) {
  const autoId = useId();
  const generatedId = id ?? autoId;
  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label htmlFor={generatedId} className="text-label text-neutral-700">
          {label}
        </label>
      )}
      <textarea
        id={generatedId}
        ref={ref}
        className={`px-md py-sm rounded-md border border-neutral-200 bg-neutral-0 text-body w-full focus:border-primary ${error ? "border-danger" : ""} ${className ?? ""}`}
        rows={4}
        {...rest}
      />
      {error ? (
        <p className="text-caption text-danger">{error}</p>
      ) : hint ? (
        <p className="text-caption text-neutral-700">{hint}</p>
      ) : null}
    </div>
  );
});
