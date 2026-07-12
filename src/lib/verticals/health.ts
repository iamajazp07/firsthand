import type { Vertical } from "./types";

/**
 * Health vertical config — the original Vivahale site.
 *
 * PARITY CONTRACT: every value here is copied verbatim from the current live
 * source so the Health site renders EXACTLY as before. Provenance per field:
 *   - name / description / categories / navPrimaryCount → src/lib/site.ts
 *   - criteria (keys/labels/weights) → src/components/review/RatingBadge.tsx
 *     (CRITERIA) + src/app/methodology/page.tsx (weights)
 *   - theme → src/app/globals.css (@theme --color-brand-*)
 *   - methodologyIntro → src/app/methodology/page.tsx (intro paragraph)
 *   - disclosureLabel/disclosureBody → src/components/AffiliateDisclosure.tsx
 *   - contentDisclaimer → src/components/MedicalDisclaimer.tsx
 *
 * NOTE: this step does NOT yet rewire site.ts/db.ts/RatingBadge to read from
 * here — it only defines the config. Those consumers are refactored later.
 */
export const health: Vertical = {
  key: "health",
  // Phase B rebrand: the Health vertical now lives on health.vivahale.com and
  // brands as "Vivahale Health" (was bare "Vivahale" on the apex). tagline /
  // description keep the same health-focused copy.
  name: "Vivahale Health",
  host: "health.vivahale.com",
  tagline: "Independent Health & Wellness Reviews",
  description:
    "Vivahale is an independent health & wellness review site. We analyze clinical research to rank supplements, telehealth providers, and health products — clearly and without hype.",

  // Brand color tokens copied from globals.css (@theme --color-brand-*).
  theme: {
    brandNavy: "#0b3d6e",
    brandBlue: "#1a6fd4",
    brandMist: "#f1f5f9",
    brandInk: "#1e293b",
    brandWhite: "#ffffff",
  },

  navPrimaryCount: 6,

  // Ordered category slugs from src/lib/site.ts NAV_CATEGORIES (same order).
  categories: [
    "weight-loss",
    "dental-oral-health",
    "sleep",
    "womens-health",
    "hearing",
    "heart-health",
    "nutrition-supplements",
    "fitness",
    "mental-wellness",
    "health-news",
    "health-tech-ai",
  ],

  // Nav entries (name + slug), copied VERBATIM from src/lib/site.ts
  // NAV_CATEGORIES so header/footer output is byte-for-byte identical. Order,
  // count, and labels match the current live nav exactly.
  navCategories: [
    { name: "Weight Loss", slug: "weight-loss" },
    { name: "Dental & Oral Health", slug: "dental-oral-health" },
    { name: "Sleep", slug: "sleep" },
    { name: "Women's Health", slug: "womens-health" },
    { name: "Hearing", slug: "hearing" },
    { name: "Heart Health", slug: "heart-health" },
    { name: "Nutrition & Supplements", slug: "nutrition-supplements" },
    { name: "Fitness", slug: "fitness" },
    { name: "Mental Wellness", slug: "mental-wellness" },
    { name: "Health News", slug: "health-news" },
    { name: "Health Tech & AI", slug: "health-tech-ai" },
  ],

  // The five existing health criteria. Keys match CriterionRatings / products
  // `ratings`. `label` (short) matches RatingBadge's CRITERIA; `longLabel` +
  // `description` match the /methodology criteria table VERBATIM; `weight`
  // matches /methodology (Safety 30%, Evidence 30%, Cost & Value 20%,
  // Transparency 10%, Support 10% → 0.30 + 0.30 + 0.20 + 0.10 + 0.10 = 1.00).
  // Both surfaces now render FROM this array, so their text stays byte-identical.
  criteria: [
    {
      key: "safety",
      label: "Safety",
      longLabel: "Safety",
      weight: 0.3,
      description:
        "Ingredient and provider safety profile, known interactions and contraindications, FDA warning letters and safety communications, and manufacturing standards.",
    },
    {
      key: "evidence",
      label: "Evidence",
      longLabel: "Evidence Quality",
      weight: 0.3,
      description:
        "Peer-reviewed clinical research behind the product's core claims. Randomized controlled trials are weighted highest, then systematic reviews, then observational studies. Marketing claims without published evidence score zero here.",
    },
    {
      key: "cost_value",
      label: "Cost & Value",
      longLabel: "Cost & Value",
      weight: 0.2,
      description:
        "Price per effective dose or per month of service, compared against alternatives that deliver the same evidence-backed benefit. Hidden fees, forced subscriptions, and cancellation friction lower this score.",
    },
    {
      key: "transparency",
      label: "Transparency",
      longLabel: "Transparency",
      weight: 0.1,
      description:
        "Label accuracy, full ingredient disclosure (no proprietary blends hiding doses), third-party testing, and honest marketing that doesn't overstate the science.",
    },
    {
      key: "support",
      label: "Support",
      longLabel: "Customer Support & Experience",
      weight: 0.1,
      description:
        "Responsiveness, refund and return policies, shipping reliability, and the real-world experience reported by verified customers.",
    },
  ],

  // Intro paragraph copied from /methodology page.
  methodologyIntro:
    "Most review sites keep their scoring rules vague, which makes it impossible to tell an honest recommendation from a paid one. We take the opposite approach: the exact criteria and weights behind every Vivahale ranking are published on this page, and they apply to every product in a category — whether or not we have any financial relationship with its maker.",

  // Affiliate disclosure copied from AffiliateDisclosure.tsx (banner body).
  disclosureLabel: "Affiliate disclosure",
  disclosureBody:
    "Vivahale is reader-supported. We earn a commission if you buy through links on this page — at no extra cost to you. Commissions never influence our rankings.",

  // Medical disclaimer copied from MedicalDisclaimer.tsx.
  contentDisclaimer:
    "This content is for informational purposes only and is not medical advice. It is not intended to diagnose, treat, cure, or prevent any disease. Consult a healthcare professional before starting any supplement, treatment, or program — especially if you are pregnant, nursing, taking medication, or managing a health condition.",

  // Health-specific tools.
  extras: {
    tools: [{ key: "sleep-quiz", label: "Sleep Quiz", path: "/quiz/sleep" }],
  },
};

export default health;
