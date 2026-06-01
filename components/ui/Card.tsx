import type { ReactNode } from "react";

export function Card({
  children,
  title,
  description,
  className,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={`rounded-lg bg-neutral-0 border border-neutral-200 p-lg ${className ?? ""}`}>
      {title && (
        <header className="mb-md">
          <h2 className="text-h2 text-neutral-900">{title}</h2>
          {description && (
            <p className="text-caption text-neutral-700 mt-xs">{description}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
