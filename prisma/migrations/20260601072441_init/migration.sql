-- CreateTable
CREATE TABLE "industries" (
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "plans" (
    "tier" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price_inr_monthly" INTEGER NOT NULL,
    "price_inr_yearly" INTEGER NOT NULL,
    "limits_json" JSONB NOT NULL,
    "features_json" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("tier")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "industry_code" VARCHAR(50) NOT NULL,
    "sub_template" VARCHAR(50),
    "plan_tier" VARCHAR(20) NOT NULL DEFAULT 'trial',
    "status" VARCHAR(20) NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMPTZ,
    "current_period_end" TIMESTAMPTZ,
    "razorpay_customer_id" VARCHAR(100),
    "razorpay_subscription_id" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_users" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "email_verified_at" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "business_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "email_verified_at" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "businesses_slug_idx" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "businesses_status_idx" ON "businesses"("status");

-- CreateIndex
CREATE INDEX "businesses_plan_tier_idx" ON "businesses"("plan_tier");

-- CreateIndex
CREATE INDEX "business_users_email_idx" ON "business_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_users_business_id_email_key" ON "business_users"("business_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_email_key" ON "platform_users"("email");

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_industry_code_fkey" FOREIGN KEY ("industry_code") REFERENCES "industries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_plan_tier_fkey" FOREIGN KEY ("plan_tier") REFERENCES "plans"("tier") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_users" ADD CONSTRAINT "business_users_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
