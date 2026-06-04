import { NextResponse } from "next/server";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as businessesRepo from "@/lib/repositories/businesses";

const ALLOWED_ROLES = new Set(["platform_owner", "super_admin", "support"]);

export async function GET() {
  const user = await getCurrentPlatformUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    return NextResponse.json(
      { error: "forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  const tenants = await businessesRepo.listForOwner(500);
  return NextResponse.json({ tenants });
}
