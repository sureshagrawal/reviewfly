import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as businessesRepo from "@/lib/repositories/businesses";
import { ToastProvider } from "@/components/ui/Toast";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata: Metadata = {
  title: "ReviewFly Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Detect whether we're on a public admin page (login/register) via pathname header.
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const isPublic =
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/register") ||
    pathname.startsWith("/admin/forgot-password") ||
    pathname.startsWith("/admin/reset-password");

  const user = isPublic ? null : await getCurrentUser();
  const tenant = user ? await businessesRepo.findById(user.tenantId) : null;

  return (
    <ToastProvider>
      {user && tenant ? (
        <div className="min-h-screen flex bg-neutral-50">
          <aside className="w-64 bg-neutral-0 border-r border-neutral-200 flex flex-col">
            <div className="px-md py-lg border-b border-neutral-200">
              <p className="text-label text-neutral-700">Workspace</p>
              <p className="text-h2 text-neutral-900 truncate">{tenant.name}</p>
              <p className="text-caption text-neutral-700">{tenant.slug}</p>
            </div>
            <nav className="flex-1 px-sm py-md flex flex-col gap-xs">
              <NavLink href="/admin/dashboard" label="Dashboard" />
              <NavLink href="/admin/flow" label="Flow" />
              <NavLink href="/admin/tags" label="Tags" />
              <NavLink href="/admin/settings" label="Settings" />
            </nav>
            <div className="px-md py-md border-t border-neutral-200">
              <p className="text-caption text-neutral-700 truncate">{user.role}</p>
              <LogoutButton />
            </div>
          </aside>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      ) : (
        <main className="min-h-screen bg-neutral-50 flex items-start sm:items-center justify-center p-md">
          <div className="w-full max-w-[28rem] shrink-0">{children}</div>
        </main>
      )}
    </ToastProvider>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-md py-sm rounded-md text-body text-neutral-900 hover:bg-neutral-50"
    >
      {label}
    </Link>
  );
}
