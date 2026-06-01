import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as usersRepo from "@/lib/repositories/business-users";
import * as businessesRepo from "@/lib/repositories/businesses";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  const [user, business] = await Promise.all([
    usersRepo.findById(u.userId),
    businessesRepo.findById(u.tenantId),
  ]);
  if (!user || !business) {
    return NextResponse.json(
      { error: "user or tenant missing", code: "STALE_TOKEN" },
      { status: 401 },
    );
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    tenant: {
      id: business.id,
      slug: business.slug,
      name: business.name,
    },
  });
}
