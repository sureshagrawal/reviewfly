export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-md">
      <div className="text-center">
        <h1 className="text-display text-neutral-900">ReviewFly</h1>
        <p className="text-body text-neutral-700 mt-md">
          Bootstrap skeleton. Phase 0 in progress.
        </p>
        <p className="text-caption text-neutral-700 mt-sm">
          Health:{" "}
          <a
            href="/api/v1/health"
            className="text-primary underline underline-offset-2"
          >
            /api/v1/health
          </a>
        </p>
      </div>
    </main>
  );
}
