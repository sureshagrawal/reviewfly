-- CreateTable
CREATE TABLE "business_settings" (
    "business_id" UUID NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "logo_url" VARCHAR(500),
    "brand_color" VARCHAR(7) NOT NULL DEFAULT '#1a73e8',
    "poster_tagline" VARCHAR(200),
    "google_review_url" VARCHAR(500),
    "whatsapp_number" VARCHAR(20),
    "ai_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sentiment_gate_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "display_timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    "hard_fallback" TEXT NOT NULL DEFAULT 'Great experience! Highly recommended.',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("business_id")
);

-- CreateTable
CREATE TABLE "business_tags" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "tag_type" VARCHAR(50) NOT NULL DEFAULT 'generic',
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content_hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "business_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_steps" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "step_key" VARCHAR(50) NOT NULL,
    "step_type" VARCHAR(30) NOT NULL,
    "question_label" VARCHAR(500) NOT NULL,
    "helper_text" VARCHAR(500),
    "config_json" JSONB NOT NULL DEFAULT '{}',
    "condition_json" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "inject_into_prompt" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "flow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_pools" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "dimension" VARCHAR(30) NOT NULL,
    "value" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 10,
    "applies_to_industry" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "prompt_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_events" (
    "id" BIGSERIAL NOT NULL,
    "business_id" UUID NOT NULL,
    "session_id" VARCHAR(40) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "payload_json" JSONB NOT NULL DEFAULT '{}',
    "ip_hash" VARCHAR(64),
    "ua_category" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_tags_business_id_category_is_active_idx" ON "business_tags"("business_id", "category", "is_active");

-- CreateIndex
CREATE INDEX "flow_steps_business_id_is_active_step_order_idx" ON "flow_steps"("business_id", "is_active", "step_order");

-- CreateIndex
CREATE UNIQUE INDEX "flow_steps_business_id_step_key_key" ON "flow_steps"("business_id", "step_key");

-- CreateIndex
CREATE INDEX "prompt_pools_business_id_dimension_is_active_idx" ON "prompt_pools"("business_id", "dimension", "is_active");

-- CreateIndex
CREATE INDEX "prompt_pools_dimension_is_active_idx" ON "prompt_pools"("dimension", "is_active");

-- CreateIndex
CREATE INDEX "review_events_business_id_created_at_idx" ON "review_events"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "review_events_business_id_session_id_idx" ON "review_events"("business_id", "session_id");
