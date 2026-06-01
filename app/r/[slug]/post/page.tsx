import { notFound } from "next/navigation";
import * as businessesRepo from "@/lib/repositories/businesses";
import * as businessSettingsRepo from "@/lib/repositories/business-settings";
import { ReviewPostPage } from "@/components/reviewer/ReviewPostPage";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await businessesRepo.findBySlug(slug);
  if (!business) notFound();
  const settings = await businessSettingsRepo.findByBusinessId(business.id);
  if (!settings) notFound();

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="bg-neutral-0 border-b border-neutral-200 px-md py-sm flex items-center gap-sm sticky top-0 z-10">
        {settings.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logo_url}
            alt={settings.display_name}
            className="h-10 w-10 rounded-md object-contain"
          />
        ) : (
          <div className="h-10 w-10 rounded-md bg-primary text-neutral-0 flex items-center justify-center font-semibold">
            {settings.display_name.slice(0, 1)}
          </div>
        )}
        <span className="text-body font-semibold text-neutral-900 truncate">
          {settings.display_name}
        </span>
      </header>
      <ReviewPostPage
        businessId={business.id}
        slug={business.slug}
        googleReviewUrl={settings.google_review_url}
        whatsappNumber={settings.whatsapp_number}
      />
    </main>
  );
}
