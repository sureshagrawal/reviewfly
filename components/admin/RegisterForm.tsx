"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          slug,
          display_name: displayName,
          industry_code: "academy",
          role: "owner",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.show(data.error ?? "registration failed", "error");
        setSubmitting(false);
        return;
      }
      toast.show("workspace created", "success");
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      toast.show("network error", "error");
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-md">
        <Input
          type="text"
          label="Workspace name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="NSG Academy"
          required
        />
        <Input
          type="text"
          label="Workspace slug (URL)"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          hint="Letters, digits, hyphens only — e.g. nsg-academy"
          required
        />
        <Input
          type="email"
          label="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Min 8 chars, with upper, lower, and a digit"
          required
        />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Create workspace
        </Button>
        <p className="text-caption text-neutral-700 text-center">
          Already have an account?{" "}
          <Link href="/admin/login" className="text-primary">
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
