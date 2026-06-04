import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as auditReadRepo from "@/lib/repositories/audit-logs-read";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const logs = await auditReadRepo.listByBusiness(user.tenantId, { limit: 100 });

  return (
    <div className="p-lg space-y-md">
      <header>
        <h1 className="text-h1 text-neutral-900">Audit log</h1>
        <p className="text-caption text-neutral-700">Most recent 100 events for this workspace</p>
      </header>

      <Card>
        <div className="overflow-auto">
          <table className="w-full min-w-[56rem]">
            <thead>
              <tr className="text-left text-label text-neutral-700 border-b border-neutral-200">
                <th className="py-sm pr-md">Time</th>
                <th className="py-sm pr-md">Action</th>
                <th className="py-sm pr-md">Entity</th>
                <th className="py-sm pr-md">Entity ID</th>
                <th className="py-sm pr-md">Actor user</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 text-body text-neutral-900">
                  <td className="py-sm pr-md">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="py-sm pr-md">{row.action}</td>
                  <td className="py-sm pr-md">{row.entity_type}</td>
                  <td className="py-sm pr-md text-caption text-neutral-700 truncate max-w-[12rem]">{row.entity_id ?? "-"}</td>
                  <td className="py-sm pr-md text-caption text-neutral-700 truncate max-w-[14rem]">{row.actor_user_id ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
