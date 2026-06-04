"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const toast = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.show("missing reset token", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.show("passwords do not match", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.show(data.error ?? "reset failed", "error");
        return;
      }
      toast.show("password reset successful", "success");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      toast.show("network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-md">
        <Input
          type="password"
          label="New password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Reset password
        </Button>
        <p className="text-caption text-neutral-700 text-center">
          Go back to{" "}
          <Link href="/admin/login" className="text-primary">
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
