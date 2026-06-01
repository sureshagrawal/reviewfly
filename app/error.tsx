"use client";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex items-center justify-center p-md">
          <div className="text-center max-w-md">
            <h1 className="text-h1 text-danger">Something went wrong</h1>
            <p className="text-body text-neutral-700 mt-md">
              An unexpected error occurred. Please try again.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-lg min-h-touch px-lg rounded-md bg-primary text-neutral-0"
            >
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
