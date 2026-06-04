import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const OWNER_EMAIL = "admin@digiworksoft.in";
const DEFAULT_PASSWORD = "TempGoogleOnly123A";
const TARGET_SLUG_HINTS = ["nsg", "rankers"];

async function main() {
  const connectionString =
    process.env["DIRECT_DATABASE_URL"] ?? process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const businesses = await prisma.business.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { slug: "asc" },
  });

  const matchedBusinesses = businesses.filter((b) =>
    TARGET_SLUG_HINTS.some((hint) => b.slug.toLowerCase().includes(hint)),
  );

  if (matchedBusinesses.length === 0) {
    console.warn(
      "No target businesses matched hints. Available slugs:",
      businesses.map((b) => b.slug).join(", "),
    );
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const b of matchedBusinesses) {
    await prisma.businessUser.upsert({
      where: {
        businessId_email: {
          businessId: b.id,
          email: OWNER_EMAIL,
        },
      },
      update: {
        role: "owner",
        deletedAt: null,
        updatedAt: new Date(),
      },
      create: {
        businessId: b.id,
        email: OWNER_EMAIL,
        passwordHash,
        role: "owner",
      },
    });
  }

  await prisma.platformUser.upsert({
    where: { email: OWNER_EMAIL },
    update: {
      role: "super_admin",
      isActive: true,
      deletedAt: null,
      updatedAt: new Date(),
    },
    create: {
      email: OWNER_EMAIL,
      passwordHash,
      role: "super_admin",
      isActive: true,
    },
  });

  const businessUsersForOwner = await prisma.businessUser.findMany({
    where: { email: OWNER_EMAIL, deletedAt: null },
    select: {
      email: true,
      role: true,
      businessId: true,
      business: { select: { slug: true, name: true } },
    },
    orderBy: { business: { slug: "asc" } },
  });

  const platformOwner = await prisma.platformUser.findUnique({
    where: { email: OWNER_EMAIL },
    select: { email: true, role: true, isActive: true },
  });

  process.stdout.write("Bootstrap complete.\n");
  process.stdout.write(
    `${JSON.stringify(
      {
        available_businesses: businesses.map((b) => ({ slug: b.slug, name: b.name })),
        owner_business_memberships: businessUsersForOwner,
        owner_platform_account: platformOwner,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
