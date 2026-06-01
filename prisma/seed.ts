/**
 * Seed script — one tenant (nsg-academy) with realistic CVL content
 * + one admin user for Phase 1b admin UI testing.
 *
 * Idempotent: drops & re-creates tenant rows so repeated runs stay clean.
 * Universal prompt_pools are upserted by (dimension, value).
 *
 * Usage: pnpm seed
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const connectionString =
  process.env["DIRECT_DATABASE_URL"] ?? process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "admin@nsg-academy.local";
const ADMIN_PASSWORD = "ChangeMe123Now";

const UNIVERSAL_POOLS: Array<{ dimension: string; value: string; weight?: number }> = [
  // openings
  { dimension: "opening", value: "Just had to share" },
  { dimension: "opening", value: "Honestly impressed" },
  { dimension: "opening", value: "Wasn't sure what to expect, but" },
  { dimension: "opening", value: "Genuinely surprised" },
  { dimension: "opening", value: "Booked here on a recommendation and" },
  { dimension: "opening", value: "Few places get this right" },
  { dimension: "opening", value: "Glad I tried" },
  // tones
  { dimension: "tone", value: "warm and personal" },
  { dimension: "tone", value: "straightforward, no fluff" },
  { dimension: "tone", value: "enthusiastic but believable" },
  { dimension: "tone", value: "calm and matter-of-fact" },
  { dimension: "tone", value: "appreciative" },
  // language
  { dimension: "language", value: "everyday English, conversational" },
  { dimension: "language", value: "slightly formal English" },
  { dimension: "language", value: "Indian English, friendly" },
  // emoji
  { dimension: "emoji", value: "no emojis" },
  { dimension: "emoji", value: "at most one emoji" },
  // structure
  { dimension: "structure", value: "one tight paragraph" },
  { dimension: "structure", value: "two short paragraphs" },
  { dimension: "structure", value: "three sentences total" },
  // grammar
  { dimension: "grammar", value: "active voice, short sentences" },
  { dimension: "grammar", value: "mix short and medium sentences" },
  // staff_mention
  { dimension: "staff_mention", value: "mention staff only by role, not name" },
  { dimension: "staff_mention", value: "mention staff naturally if relevant" },
  // length
  { dimension: "length", value: "120 to 180 characters" },
  { dimension: "length", value: "180 to 260 characters" },
  { dimension: "length", value: "260 to 380 characters" },
];

async function main() {
  console.log("→ Seeding industries...");
  await prisma.industry.upsert({
    where: { code: "academy" },
    update: {},
    create: {
      code: "academy",
      name: "Academy / Coaching",
      description: "Coaching, tutoring, training institutes",
    },
  });

  console.log("→ Seeding plans...");
  await prisma.plan.upsert({
    where: { tier: "trial" },
    update: {},
    create: {
      tier: "trial",
      name: "Trial",
      description: "14-day free trial",
      priceInrMonthly: 0,
      priceInrYearly: 0,
      limitsJson: { max_reviews_per_month: 100, max_admins: 1 },
      featuresJson: { sentiment_gate: true, auto_reply: false },
    },
  });

  console.log("→ Seeding universal prompt pools...");
  for (const p of UNIVERSAL_POOLS) {
    // Upsert-by-content: delete-and-insert is acceptable for small universal set
    const existing = await prisma.promptPool.findFirst({
      where: { businessId: null, dimension: p.dimension, value: p.value },
    });
    if (!existing) {
      await prisma.promptPool.create({
        data: {
          businessId: null,
          dimension: p.dimension,
          value: p.value,
          weight: p.weight ?? 10,
          appliesToIndustry: null,
        },
      });
    }
  }

  // ---- Tenant: NSG Academy ----
  const SLUG = "nsg-academy";
  console.log(`→ Seeding tenant: ${SLUG} (drop & recreate)...`);

  // Clean previous tenant rows (cascade clears tags, settings, steps via FK)
  const existing = await prisma.business.findUnique({ where: { slug: SLUG } });
  if (existing) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId: {
          in: (
            await prisma.businessUser.findMany({
              where: { businessId: existing.id },
              select: { id: true },
            })
          ).map((u: { id: string }) => u.id),
        },
      },
    });
    await prisma.auditLog.deleteMany({ where: { businessId: existing.id } });
    await prisma.flowStep.deleteMany({ where: { businessId: existing.id } });
    await prisma.businessTag.deleteMany({ where: { businessId: existing.id } });
    await prisma.promptPool.deleteMany({ where: { businessId: existing.id } });
    await prisma.businessSettings.deleteMany({ where: { businessId: existing.id } });
    await prisma.reviewEvent.deleteMany({ where: { businessId: existing.id } });
    await prisma.businessUser.deleteMany({ where: { businessId: existing.id } });
    await prisma.business.delete({ where: { id: existing.id } });
  }

  const business = await prisma.business.create({
    data: {
      slug: SLUG,
      name: "NSG Academy",
      industryCode: "academy",
      planTier: "trial",
      status: "trial",
    },
  });

  await prisma.businessSettings.create({
    data: {
      businessId: business.id,
      displayName: "NSG Academy",
      aliases: ["NSG", "NSG Coaching"],
      brandColor: "#1a73e8",
      posterTagline: "Loved your class? Tell Google!",
      googleReviewUrl: "https://search.google.com/local/writereview?placeid=PLACEHOLDER",
      whatsappNumber: "+919999999999",
      aiEnabled: true,
      sentimentGateThreshold: 0.6,
      hardFallback: "Great teaching and supportive faculty at NSG Academy. Highly recommended.",
    },
  });

  // Courses
  const courses = [
    {
      name: "JEE Main 2026",
      description: "JEE Main full prep batch",
      aliases: ["JEE Mains", "Joint Entrance Exam", "JEE Main batch"],
      contentHints: [
        "Physics fundamentals improved significantly",
        "Mock tests every week",
        "+40 marks improvement in 3 months",
      ],
    },
    {
      name: "NEET Foundation",
      description: "Biology + Chemistry foundation for NEET",
      aliases: ["NEET Prep", "Medical Foundation", "NEET batch"],
      contentHints: [
        "Biology concepts crystal clear",
        "Doubt-clearing sessions on demand",
      ],
    },
    {
      name: "CET Crash Course",
      description: "Short, intensive prep for state CET",
      aliases: ["CET Crash", "CET Intensive"],
      contentHints: ["Last-mile revision was a game changer"],
    },
  ];
  for (const [i, c] of courses.entries()) {
    await prisma.businessTag.create({
      data: {
        businessId: business.id,
        category: "courses",
        name: c.name,
        description: c.description,
        tagType: "course",
        aliases: c.aliases,
        contentHints: c.contentHints,
        displayOrder: i,
      },
    });
  }

  // Staff
  const staff = ["Dr. Sharma (Physics)", "Ms. Patil (Biology)", "Mr. Iyer (Chemistry)"];
  for (const [i, name] of staff.entries()) {
    await prisma.businessTag.create({
      data: {
        businessId: business.id,
        category: "staff",
        name,
        tagType: "staff",
        displayOrder: i,
      },
    });
  }

  // Flow steps
  const steps = [
    {
      step_order: 0,
      step_key: "rating",
      step_type: "rating",
      question_label: "How was your experience?",
      helper_text: "Tap stars to rate",
      config_json: {},
      is_required: true,
      inject_into_prompt: true,
    },
    {
      step_order: 1,
      step_key: "course",
      step_type: "multi_choice",
      question_label: "Which course did you join?",
      helper_text: "Pick up to 2",
      config_json: { options_source: "business_tags", category: "courses", max_picks: 2 },
      is_required: true,
      inject_into_prompt: true,
    },
    {
      step_order: 2,
      step_key: "highlight",
      step_type: "text_long",
      question_label: "What stood out for you?",
      helper_text: "Anything specific you'd like us to mention (optional)",
      config_json: {},
      is_required: false,
      inject_into_prompt: true,
    },
  ];
  for (const s of steps) {
    await prisma.flowStep.create({
      data: {
        businessId: business.id,
        stepOrder: s.step_order,
        stepKey: s.step_key,
        stepType: s.step_type,
        questionLabel: s.question_label,
        helperText: s.helper_text,
        configJson: s.config_json,
        isRequired: s.is_required,
        injectIntoPrompt: s.inject_into_prompt,
      },
    });
  }

  // Admin user for Phase 1b admin UI
  await _seedAdmin(business.id);

  console.log("✓ Seed complete");
  console.log(`  Visit:    http://localhost:3000/r/${SLUG}`);
  console.log(`  Admin:    http://localhost:3000/admin/login`);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
}

async function _seedAdmin(businessId: string) {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.businessUser.create({
    data: {
      businessId,
      email: ADMIN_EMAIL,
      passwordHash,
      role: "owner",
    },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
