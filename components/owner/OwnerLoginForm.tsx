"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function OwnerLoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/owner/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.show(data.error ?? "login failed", "error");
        return;
      }
      toast.show("owner login success", "success");
      router.replace("/owner/dashboard");
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
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => {
            window.location.href = "/api/v1/auth/google/start?next=/owner/dashboard";
          }}
        >
          <span className="inline-flex items-center gap-sm justify-center w-full">
            <GoogleLogo />
            Continue with Google
          </span>
        </Button>
        <div className="h-px bg-neutral-200" />
        <Input
          type="email"
          label="Owner email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" loading={submitting} className="w-full">
          Sign in as Owner
        </Button>
      </form>
    </Card>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.8-4.2 2.8-7.1 0-.7-.1-1.4-.2-2H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.6 0 4.8-.9 6.4-2.4l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.5-1.6-5.2-3.8H3.6v2.5C5.2 19.9 8.3 22 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.8 14.3c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V8.2H3.6C2.9 9.6 2.5 11.1 2.5 12.5s.4 2.9 1.1 4.3l3.2-2.5z"
      />
      <path
        fill="#4285F4"
        d="M12 6.9c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.8 4.2 14.6 3.3 12 3.3 8.3 3.3 5.2 5.4 3.6 8.2l3.2 2.5c.7-2.2 2.7-3.8 5.2-3.8z"
      />
    </svg>
  );
}
