import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as platformUsersRepo from "@/lib/repositories/platform-users";
import * as businessesRepo from "@/lib/repositories/businesses";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const session = await getCurrentPlatformUser();
  if (!session) redirect("/owner/login");

  const [user, tenants] = await Promise.all([
    platformUsersRepo.findById(session.userId),
    businessesRepo.listForOwner(500),
  ]);
  if (!user || !user.is_active) redirect("/owner/login");

  const active = tenants.filter((t) => t.status === "active").length;
  const trial = tenants.filter((t) => t.status === "trial").length;

  return (
    <div className="p-lg space-y-md">
      <header>
        <h1 className="text-h1 text-neutral-900">Owner Dashboard</h1>
        <p className="text-caption text-neutral-700 mt-xs">{user.email} • {user.role}</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <StatCard label="Total tenants" value={tenants.length} />
        <StatCard label="Active" value={active} />
        <StatCard label="Trial" value={trial} />
        <StatCard label="Suspended" value={tenants.filter((t) => t.status === "suspended").length} />
      </div>

      <Card title="Quick actions">
        <div className="flex flex-wrap gap-sm">
          <Link href="/owner/tenants" className="text-primary text-body">
            View tenants list
          </Link>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-label text-neutral-700">{label}</p>
      <p className="text-display text-neutral-900 mt-xs">{value}</p>
    </Card>
  );
}
