import { redirect } from "next/navigation";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as poolsRepo from "@/lib/repositories/prompt-pools";
import { ENGINE_DIMENSIONS } from "@/lib/constants/step-types";
import { OwnerPoolsManager } from "@/components/owner/OwnerPoolsManager";

const ALLOWED_ROLES = new Set(["platform_owner", "super_admin", "support"]);
const WRITE_ROLES = new Set(["platform_owner", "super_admin"]);

export const dynamic = "force-dynamic";

export default async function OwnerPoolsPage() {
  const session = await getCurrentPlatformUser();
  if (!session) redirect("/owner/login");
  if (!ALLOWED_ROLES.has(session.role)) redirect("/owner/dashboard");

  const pools = await poolsRepo.listUniversal({ limit: 500 });

  return (
    <div className="p-lg space-y-md">
      <header>
        <h1 className="text-h1 text-neutral-900">Universal prompt pools</h1>
        <p className="text-caption text-neutral-700">
          Curate dimension entries used by the uniqueness engine across all tenants.
        </p>
      </header>
      <OwnerPoolsManager
        initialPools={pools.map((p) => ({
          id: p.id,
          dimension: p.dimension,
          value: p.value,
          weight: p.weight,
          applies_to_industry: p.applies_to_industry,
          is_active: p.is_active,
        }))}
        dimensions={ENGINE_DIMENSIONS}
        canWrite={WRITE_ROLES.has(session.role)}
      />
    </div>
  );
}
