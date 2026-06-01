"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function LoginForm({ allowRegister }: { allowRegister: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin/dashboard";
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.show(data.error ?? "login failed", "error");
        setSubmitting(false);
        return;
      }
      toast.show("welcome back", "success");
      router.replace(next);
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Sign in
        </Button>
        {allowRegister && (
          <p className="text-caption text-neutral-700 text-center">
            New here?{" "}
            <Link href="/admin/register" className="text-primary">
              Create a workspace
            </Link>
          </p>
        )}
      </form>
    </Card>
  );
}
