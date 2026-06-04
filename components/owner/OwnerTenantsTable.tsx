"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Tenant = {
  id: string;
  slug: string;
  name: string;
  industry_code: string;
  plan_tier: string;
  status: string;
  created_at: string | Date;
};

export function OwnerTenantsTable({
  initialTenants,
  canWrite,
  canImpersonate,
}: {
  initialTenants: Tenant[];
  canWrite: boolean;
  canImpersonate: boolean;
}) {
  const [tenants, setTenants] = useState(initialTenants);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const updateStatus = async (tenant: Tenant, status: "active" | "suspended") => {
    if (!canWrite) return;
    setBusyId(tenant.id);
    try {
      const res = await fetch(`/api/v1/owner/tenants/${tenant.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.show(data.error ?? "status update failed", "error");
        return;
      }
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, status } : t)),
      );
      toast.show(
        status === "suspended" ? "tenant suspended" : "tenant restored",
        "success",
      );
    } catch {
      toast.show("network error", "error");
    } finally {
      setBusyId(null);
    }
  };

  const impersonate = async (tenant: Tenant) => {
    if (!canImpersonate) return;
    const reason = window.prompt(
      "Reason for impersonating this tenant (min 8 chars, will be audit-logged):",
      "",
    );
    if (!reason || reason.trim().length < 8) {
      toast.show("reason required (8+ chars)", "error");
      return;
    }
    setBusyId(tenant.id);
    try {
      const res = await fetch(`/api/v1/owner/tenants/${tenant.id}/impersonate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = (await res.json()) as { error?: string; redirect?: string };
      if (!res.ok) {
        toast.show(data.error ?? "impersonation failed", "error");
        return;
      }
      toast.show("impersonating tenant (read-only)", "success");
      window.location.href = data.redirect ?? "/admin/dashboard";
    } catch {
      toast.show("network error", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <div className="overflow-auto">
        <table className="w-full min-w-[62rem]">
          <thead>
            <tr className="text-left text-label text-neutral-700 border-b border-neutral-200">
              <th className="py-sm pr-md">Name</th>
              <th className="py-sm pr-md">Slug</th>
              <th className="py-sm pr-md">Industry</th>
              <th className="py-sm pr-md">Plan</th>
              <th className="py-sm pr-md">Status</th>
              <th className="py-sm pr-md">Created</th>
              <th className="py-sm pr-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const isSuspended = t.status === "suspended";
              const isBusy = busyId === t.id;
              return (
                <tr key={t.id} className="border-b border-neutral-100 text-body text-neutral-900">
                  <td className="py-sm pr-md">{t.name}</td>
                  <td className="py-sm pr-md">{t.slug}</td>
                  <td className="py-sm pr-md">{t.industry_code}</td>
                  <td className="py-sm pr-md">{t.plan_tier}</td>
                  <td className="py-sm pr-md">{t.status}</td>
                  <td className="py-sm pr-md">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="py-sm pr-md">
                    <div className="flex flex-wrap gap-xs">
                      {canWrite ? (
                        isSuspended ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={isBusy}
                            onClick={() => updateStatus(t, "active")}
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="danger"
                            loading={isBusy}
                            onClick={() => updateStatus(t, "suspended")}
                          >
                            Suspend
                          </Button>
                        )
                      ) : null}
                      {canImpersonate ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={isBusy}
                          onClick={() => impersonate(t)}
                        >
                          View as
                        </Button>
                      ) : null}
                      {!canWrite && !canImpersonate ? (
                        <span className="text-caption text-neutral-700">Read-only</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
