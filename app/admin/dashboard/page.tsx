import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type StatRow = {
  total_events: bigint;
  scans: bigint;
  ai_generated: bigint;
  fallback_used: bigint;
  copied: bigint;
  negative: bigint;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const sinceDays = 30;
  const rows = await sql<StatRow[]>`
    SELECT
      COUNT(*) AS total_events,
      COUNT(*) FILTER (WHERE event_type = 'scan') AS scans,
      COUNT(*) FILTER (WHERE event_type = 'ai_generated') AS ai_generated,
      COUNT(*) FILTER (WHERE event_type = 'fallback_used') AS fallback_used,
      COUNT(*) FILTER (WHERE event_type = 'post_on_google_clicked') AS copied,
      COUNT(*) FILTER (WHERE event_type = 'negative_feedback') AS negative
    FROM review_events
    WHERE business_id = ${user.tenantId}
      AND created_at >= NOW() - (${sinceDays} || ' days')::interval
  `;
  const stats = rows[0] ?? {
    total_events: 0n,
    scans: 0n,
    ai_generated: 0n,
    fallback_used: 0n,
    copied: 0n,
    negative: 0n,
  };
  const generated = Number(stats.ai_generated) + Number(stats.fallback_used);
  const posted = Number(stats.copied);
  const conversion = generated > 0 ? Math.round((posted / generated) * 100) : 0;

  return (
    <div className="p-lg space-y-lg">
      <header>
        <h1 className="text-h1 text-neutral-900">Dashboard</h1>
        <p className="text-caption text-neutral-700">Last {sinceDays} days</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <StatCard label="Reviews generated" value={generated} />
        <StatCard label="Posted to Google" value={posted} />
        <StatCard label="Conversion" value={`${conversion}%`} />
        <StatCard label="Negative redirects" value={Number(stats.negative)} />
      </div>

      <Card title="Getting started">
        <ol className="list-decimal pl-lg flex flex-col gap-sm text-body text-neutral-900">
          <li>
            Update your Google review URL in{" "}
            <a href="/admin/settings" className="text-primary">Settings</a>.
          </li>
          <li>
            Add the courses or services you offer in{" "}
            <a href="/admin/tags" className="text-primary">Tags</a>.
          </li>
          <li>
            Share your reviewer link with customers.
          </li>
        </ol>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p className="text-label text-neutral-700">{label}</p>
      <p className="text-display text-neutral-900 mt-xs">{value}</p>
    </Card>
  );
}