import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as tagsRepo from "@/lib/repositories/business-tags";
import { TagList } from "@/components/admin/TagList";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const tags = await tagsRepo.listByBusiness(user.tenantId, { activeOnly: false });

  return (
    <div className="p-lg max-w-[48rem]">
      <header className="mb-lg">
        <h1 className="text-h1 text-neutral-900">Tags</h1>
        <p className="text-caption text-neutral-700">
          Courses, services, dishes, or staff — referenced in your reviews
        </p>
      </header>
      <TagList
        initialTags={tags.map((t) => ({
          id: t.id,
          category: t.category,
          name: t.name,
          description: t.description,
          aliases: t.aliases,
          content_hints: t.content_hints,
          is_active: t.is_active,
        }))}
      />
    </div>
  );
}
