export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center p-md">
      <div
        role="status"
        aria-label="Loading"
        className="h-10 w-10 rounded-full border-2 border-neutral-200 border-t-primary animate-spin"
      />
    </main>
  );
}
