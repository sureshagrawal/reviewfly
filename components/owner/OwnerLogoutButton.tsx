"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function OwnerLogoutButton() {
  const router = useRouter();

  const onClick = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.replace("/owner/login");
    router.refresh();
  };

  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="w-full mt-xs">
      Logout
    </Button>
  );
}
