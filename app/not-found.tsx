import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-md">
      <div className="text-center max-w-[28rem]">
        <h1 className="text-h1 text-neutral-900">404 — Not found</h1>
        <p className="text-body text-neutral-700 mt-md">
          The page you were looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block mt-lg min-h-touch px-lg py-sm rounded-md bg-primary text-neutral-0"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
