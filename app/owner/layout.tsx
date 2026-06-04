import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ToastProvider } from "@/components/ui/Toast";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as platformUsersRepo from "@/lib/repositories/platform-users";
import { OwnerLogoutButton } from "@/components/owner/OwnerLogoutButton";

export const metadata: Metadata = {
  title: "ReviewFly Owner",
};

export const dynamic = "force-dynamic";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const isPublic = pathname.startsWith("/owner/login");
  const session = isPublic ? null : await getCurrentPlatformUser();
  const user = session ? await platformUsersRepo.findById(session.userId) : null;

  return (
    <ToastProvider>
      {isPublic || !user ? (
        <main className="min-h-screen bg-gradient-page flex items-start sm:items-center justify-center p-md">
          <div className="w-full max-w-[28rem] shrink-0">{children}</div>
        </main>
      ) : (
        <div className="min-h-screen flex bg-neutral-50">
          <aside className="w-64 bg-neutral-0 border-r border-neutral-200 flex flex-col shadow-card-sm">
            <div className="px-md py-lg border-b border-neutral-200">
              <div className="flex items-center gap-sm mb-md">
                <span className="h-9 w-9 rounded-pill bg-gradient-brand text-neutral-0 flex items-center justify-center font-semibold">
                  R
                </span>
                <span className="text-h2 text-neutral-900 font-semibold">Owner</span>
              </div>
              <p className="text-label text-neutral-700 uppercase tracking-wide">Account</p>
              <p className="text-body text-neutral-900 font-medium truncate mt-xs">{user.email}</p>
              <p className="text-caption text-neutral-700">{user.role}</p>
            </div>
            <nav className="flex-1 px-sm py-md flex flex-col gap-xs" aria-label="Owner primary">
              <OwnerNavLink href="/owner/dashboard" label="Dashboard" pathname={pathname} />
              <OwnerNavLink href="/owner/tenants" label="Tenants" pathname={pathname} />
              <OwnerNavLink href="/owner/pools" label="Prompt pools" pathname={pathname} />
              <OwnerNavLink href="/owner/audit-log" label="Audit log" pathname={pathname} />
            </nav>
            <div className="px-md py-md border-t border-neutral-200">
              <OwnerLogoutButton />
            </div>
          </aside>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      )}
    </ToastProvider>
  );
}

function OwnerNavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(href + "/");
  const stateClass = active
    ? "bg-primary-tint text-brand font-medium"
    : "text-neutral-900 hover:bg-neutral-50";
  return (
    <Link
      href={href}
      className={`px-md py-sm rounded-md text-body transition ${stateClass}`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
