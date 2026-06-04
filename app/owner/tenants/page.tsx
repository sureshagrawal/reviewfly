import { redirect } from "next/navigation";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as businessesRepo from "@/lib/repositories/businesses";
import { OwnerTenantsTable } from "@/components/owner/OwnerTenantsTable";

const ALLOWED_ROLES = new Set(["platform_owner", "super_admin", "support"]);
const WRITE_ROLES = new Set(["platform_owner", "super_admin"]);
const IMPERSONATE_ROLES = new Set(["platform_owner", "super_admin", "support"]);

export const dynamic = "force-dynamic";

export default async function OwnerTenantsPage() {
  const session = await getCurrentPlatformUser();
  if (!session) redirect("/owner/login");
  if (!ALLOWED_ROLES.has(session.role)) redirect("/owner/dashboard");

  const tenants = await businessesRepo.listForOwner(500);

  return (
    <div className="p-lg space-y-md">
      <header>
        <h1 className="text-h1 text-neutral-900">Tenants</h1>
        <p className="text-caption text-neutral-700">{tenants.length} workspace(s)</p>
      </header>

      <OwnerTenantsTable
        initialTenants={tenants}
        canWrite={WRITE_ROLES.has(session.role)}
        canImpersonate={IMPERSONATE_ROLES.has(session.role)}
      />
    </div>
  );
}
