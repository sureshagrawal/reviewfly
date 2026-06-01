"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { StarRow } from "@/components/ui/StarRow";
import { readGenerated, clearGenerated, getOrCreateSessionId } from "./session";

export function ReviewPostPage(props: {
  businessId: string;
  slug: string;
  googleReviewUrl: string | null;
  whatsappNumber: string | null;
}) {
  const router = useRouter();
  // Lazy initializer runs once on mount, before paint — no "setState in effect"
  // anti-pattern. SSR returns null because window/sessionStorage is undefined.
  const [initial] = useState<
    { review: string; provider: string } | null
  >(() => {
    if (typeof window === "undefined") return null;
    const stored = readGenerated();
    return stored ? { review: stored.review, provider: stored.provider } : null;
  });
  const [text, setText] = useState(initial?.review ?? "");
  const [provider] = useState(initial?.provider ?? "");
  const [rating, setRating] = useState(5);
  const [copied, setCopied] = useState(false);
  const hydrated = initial !== null;

  useEffect(() => {
    if (!hydrated) router.replace(`/r/${props.slug}`);
  }, [hydrated, props.slug, router]);

  const logEvent = async (eventType: string, payload?: Record<string, unknown>) => {
    try {
      await fetch("/api/v1/review/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: props.businessId,
          session_id: getOrCreateSessionId(),
          event_type: eventType,
          payload,
        }),
      });
    } catch {
      // best-effort; never block the user
    }
  };

  const copyAndOpenGoogle = async () => {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    setCopied(true);
    await logEvent("post_on_google_clicked", { length: text.length, rating });
    if (props.googleReviewUrl) {
      window.open(props.googleReviewUrl, "_blank", "noopener,noreferrer");
    }
    clearGenerated();
  };

  const openWhatsApp = async () => {
    const num = (props.whatsappNumber ?? "").replace(/[^\d+]/g, "");
    const msg = encodeURIComponent(
      `Hi, I had some feedback after my visit:\n\n${text}`,
    );
    await logEvent("negative_feedback", { length: text.length, rating });
    if (num) {
      window.open(`https://wa.me/${num}?text=${msg}`, "_blank", "noopener,noreferrer");
    }
    clearGenerated();
  };

  const onRatingChange = (n: number) => {
    setRating(n);
    if (n < 5) void logEvent("sentiment_scored", { rating: n, source: "manual" });
  };

  if (!hydrated) {
    return (
      <div className="p-md">
        <div className="h-32 rounded-md bg-neutral-200 animate-pulse" />
      </div>
    );
  }

  // Negative path — sentiment gate (manual: rating < 5)
  if (rating < 5) {
    return (
      <section className="p-md max-w-[640px] mx-auto w-full">
        <Card>
          <h1 className="text-h1 text-neutral-900">We hear you</h1>
          <p className="text-body text-neutral-700 mt-sm">
            Please share what went wrong. We&apos;d rather fix it directly than have you post publicly.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="mt-md w-full px-md py-sm rounded-md border border-neutral-200 bg-neutral-0 text-body"
          />
          <div className="mt-lg flex flex-col gap-sm">
            {props.whatsappNumber && (
              <button
                type="button"
                onClick={openWhatsApp}
                className="min-h-touch-lg w-full rounded-md bg-success text-neutral-0 font-medium"
              >
                Message us on WhatsApp
              </button>
            )}
            <button
              type="button"
              onClick={() => setRating(5)}
              className="min-h-touch-lg w-full rounded-md border border-neutral-200 text-neutral-900"
            >
              Actually, I want to leave 5 stars
            </button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="p-md max-w-[640px] mx-auto w-full">
      <Card>
        <h1 className="text-h1 text-neutral-900 text-center">Your review is ready!</h1>
        <p className="text-body text-neutral-700 mt-sm text-center">
          Review the text below, then copy and post it on Google.
        </p>

        <div className="mt-md">
          <StarRow value={rating} max={5} size="lg" onChange={onRatingChange} />
        </div>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            void logEvent("review_edited", { length: e.target.value.length });
          }}
          rows={7}
          className="mt-md w-full px-md py-sm rounded-md border border-neutral-200 bg-neutral-0 text-body resize-y"
        />
        <p className="text-caption text-neutral-700 mt-xs text-center">
          {text.length} chars · provider: {provider}
        </p>

        <div className="mt-lg flex flex-col gap-sm">
          <button
            type="button"
            onClick={copyAndOpenGoogle}
            className="min-h-touch-lg w-full rounded-md bg-brand text-neutral-0 font-medium shadow-card-md"
          >
            {copied ? "Copied! Opening Google..." : "📋  Copy & Post Review"}
          </button>
          {!props.googleReviewUrl && (
            <p className="text-caption text-warning text-center">
              Google review URL not set yet — copy will still work
            </p>
          )}
        </div>
      </Card>
    </section>
  );
}
