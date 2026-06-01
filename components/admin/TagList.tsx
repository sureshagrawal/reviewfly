"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, TextArea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "./adminFetch";

export type TagItem = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  aliases: string[];
  content_hints: string[];
  is_active: boolean;
};

export function TagList({ initialTags }: { initialTags: TagItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [adding, setAdding] = useState(false);

  // New-tag form state
  const [category, setCategory] = useState("courses");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [aliasesText, setAliasesText] = useState("");
  const [hintsText, setHintsText] = useState("");
  const [saving, setSaving] = useState(false);

  const parseList = (s: string) =>
    s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

  const resetForm = () => {
    setName("");
    setDescription("");
    setAliasesText("");
    setHintsText("");
  };

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminFetch("/api/v1/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name,
          description: description || null,
          aliases: parseList(aliasesText),
          content_hints: parseList(hintsText),
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok || !data.id) {
        toast.show(data.error ?? "create failed", "error");
        return;
      }
      toast.show("tag added", "success");
      setTags((prev) => [
        {
          id: data.id!,
          category,
          name,
          description: description || null,
          aliases: parseList(aliasesText),
          content_hints: parseList(hintsText),
          is_active: true,
        },
        ...prev,
      ]);
      resetForm();
      setAdding(false);
      router.refresh();
    } catch {
      toast.show("network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteTag = async (id: string) => {
    const confirmed = window.confirm("Delete this tag?");
    if (!confirmed) return;
    const res = await adminFetch(`/api/v1/admin/tags/${id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.show(data.error ?? "delete failed", "error");
      return;
    }
    setTags((prev) => prev.filter((t) => t.id !== id));
    toast.show("tag deleted", "success");
  };

  const toggleActive = async (tag: TagItem) => {
    const newActive = !tag.is_active;
    const res = await adminFetch(`/api/v1/admin/tags/${tag.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newActive }),
    });
    if (!res.ok) {
      toast.show("update failed", "error");
      return;
    }
    setTags((prev) =>
      prev.map((t) => (t.id === tag.id ? { ...t, is_active: newActive } : t)),
    );
  };

  return (
    <div className="flex flex-col gap-md">
      {!adding && (
        <Button onClick={() => setAdding(true)} size="md">
          + Add tag
        </Button>
      )}
      {adding && (
        <Card title="New tag">
          <form onSubmit={createTag} className="flex flex-col gap-md">
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              hint="courses | staff | services | dishes | ..."
              required
            />
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextArea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TextArea
              label="Aliases (one per line)"
              value={aliasesText}
              onChange={(e) => setAliasesText(e.target.value)}
              hint="Alternate names the AI may use"
            />
            <TextArea
              label="Content hints (one per line)"
              value={hintsText}
              onChange={(e) => setHintsText(e.target.value)}
              hint="Phrases the AI may weave in"
            />
            <div className="flex gap-sm">
              <Button type="submit" loading={saving}>Save tag</Button>
              <Button type="button" variant="ghost" onClick={() => { setAdding(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-col gap-sm">
        {tags.length === 0 && (
          <Card>
            <p className="text-body text-neutral-700">
              No tags yet — add your first one above.
            </p>
          </Card>
        )}
        {tags.map((tag) => (
          <Card key={tag.id}>
            <div className="flex items-start gap-md">
              <div className="flex-1">
                <p className="text-label text-neutral-700">{tag.category}</p>
                <p className="text-h2 text-neutral-900">{tag.name}</p>
                {tag.description && (
                  <p className="text-caption text-neutral-700 mt-xs">{tag.description}</p>
                )}
                {tag.aliases.length > 0 && (
                  <p className="text-caption text-neutral-700 mt-sm">
                    Aliases: {tag.aliases.join(", ")}
                  </p>
                )}
                {tag.content_hints.length > 0 && (
                  <p className="text-caption text-neutral-700">
                    Hints: {tag.content_hints.length}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-xs">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void toggleActive(tag)}
                >
                  {tag.is_active ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => void deleteTag(tag.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
