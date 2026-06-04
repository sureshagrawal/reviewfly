import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as auditPlatformRepo from "@/lib/repositories/audit-logs-platform";

const ALLOWED_ROLES = new Set(["platform_owner", "super_admin", "support"]);

export const dynamic = "force-dynamic";

export default async function OwnerAuditLogPage() {
  const session = await getCurrentPlatformUser();
  if (!session) redirect("/owner/login");
  if (!ALLOWED_ROLES.has(session.role)) redirect("/owner/dashboard");

  const logs = await auditPlatformRepo.listPlatformWide({ limit: 200 });

  return (
    <div className="p-lg space-y-md">
      <header>
        <h1 className="text-h1 text-neutral-900">Platform audit log</h1>
        <p className="text-caption text-neutral-700">Most recent 200 events across all tenants</p>
      </header>

      <Card>
        <div className="overflow-auto">
          <table className="w-full min-w-[64rem]">
            <thead>
              <tr className="text-left text-label text-neutral-700 border-b border-neutral-200">
                <th className="py-sm pr-md">Time</th>
                <th className="py-sm pr-md">Action</th>
                <th className="py-sm pr-md">Entity</th>
                <th className="py-sm pr-md">Tenant</th>
                <th className="py-sm pr-md">Actor</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 text-body text-neutral-900">
                  <td className="py-sm pr-md">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="py-sm pr-md">{row.action}</td>
                  <td className="py-sm pr-md">{row.entity_type}</td>
                  <td className="py-sm pr-md text-caption text-neutral-700 truncate max-w-[14rem]">
                    {row.business_id ?? "platform"}
                  </td>
                  <td className="py-sm pr-md text-caption text-neutral-700 truncate max-w-[14rem]">
                    {row.actor_user_id ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
