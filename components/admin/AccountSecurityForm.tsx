"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "./adminFetch";

type Props = {
  currentEmail: string;
};

type ApiError = {
  error?: string;
  issues?: Array<{ message?: string; path?: string[] }>;
};

export function AccountSecurityForm({ currentEmail }: Props) {
  const toast = useToast();
  const [email, setEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCurrentPassword = currentPassword.trim();
    const normalizedNewPassword = newPassword.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    const emailChanged = normalizedEmail !== currentEmail.toLowerCase();
    const passwordChanged = normalizedNewPassword.length > 0;

    if (!emailChanged && !passwordChanged) {
      toast.show("no profile change to save", "error");
      return;
    }

    if (passwordChanged && normalizedNewPassword !== normalizedConfirmPassword) {
      toast.show("new passwords do not match", "error");
      return;
    }

    if (!normalizedCurrentPassword) {
      toast.show("enter current password to confirm", "error");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        current_password: normalizedCurrentPassword,
      };
      if (emailChanged) body["email"] = normalizedEmail;
      if (passwordChanged) body["new_password"] = normalizedNewPassword;

      const res = await adminFetch("/api/v1/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ApiError;
      if (!res.ok) {
        const issue = data.issues?.[0]?.message;
        toast.show(issue ?? data.error ?? "profile update failed", "error");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.show("profile updated", "success");
    } catch {
      toast.show("network error", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSave}>
      <Card title="Account security">
        <div className="flex flex-col gap-md">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            label="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            hint="Required to confirm email/password updates"
            required
          />
          <Input
            type="password"
            label="New password (optional)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="Min 8 chars with uppercase, lowercase and digit"
          />
          <Input
            type="password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Update account
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
