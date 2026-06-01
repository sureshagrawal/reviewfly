import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as settingsRepo from "@/lib/repositories/business-settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const settings = await settingsRepo.findByBusinessId(user.tenantId);
  if (!settings) redirect("/admin/dashboard");

  return (
    <div className="p-lg max-w-[42rem]">
      <header className="mb-lg">
        <h1 className="text-h1 text-neutral-900">Settings</h1>
        <p className="text-caption text-neutral-700">
          Branding, integrations, and review preferences
        </p>
      </header>
      <SettingsForm
        initial={{
          display_name: settings.display_name,
          brand_color: settings.brand_color,
          google_review_url: settings.google_review_url,
          whatsapp_number: settings.whatsapp_number,
          poster_tagline: settings.poster_tagline,
          ai_enabled: settings.ai_enabled,
          sentiment_gate_threshold: settings.sentiment_gate_threshold,
          hard_fallback: settings.hard_fallback,
        }}
      />
    </div>
  );
}
