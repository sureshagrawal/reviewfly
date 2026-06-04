"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ForgotPasswordForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        toast.show("could not submit request", "error");
      } else {
        setDone(true);
        toast.show("if the email exists, reset link was sent", "success");
      }
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
          type="email"
          label="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Send reset link
        </Button>
        {done && (
          <p className="text-caption text-neutral-700 text-center">
            Check your inbox. In local/dev, link is logged to server logs.
          </p>
        )}
        <p className="text-caption text-neutral-700 text-center">
          Remembered password?{" "}
          <Link href="/admin/login" className="text-primary">
            Back to sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
