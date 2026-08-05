import type { Vertical } from "./types";

/**
 * Health vertical config — the original Firsthand site.
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
  // Phase B rebrand: the Health vertical now lives on health.readfirsthand.com and
  // brands as "Firsthand Health" (was bare "Firsthand" on the apex). tagline /
  // description keep the same health-focused copy.
  name: "Firsthand Health",
  host: "readfirsthand.com",
  tagline: "Independent Health & Wellness Reviews",
  description:
    "Firsthand is an independent health & wellness review site. We analyze clinical research to rank supplements, telehealth providers, and health products — clearly and without hype.",

  // Brand color tokens copied from globals.css (@theme --color-brand-*).
  theme: {
    brandNavy: "#0b3d6e",
    brandBlue: "#1a6fd4",
    brandMist: "#f1f5f9",
    brandInk: "#1e293b",
    brandWhite: "#ffffff",
  },

  navPrimaryCount: 6,

  // Category slugs that render the news-list layout on /category/[slug].
  // Copied VERBATIM from the previous hardcoded NEWS_CATEGORIES set in
  // src/app/category/[slug]/page.tsx so health output stays byte-identical.
  newsCategorySlugs: ["health-news", "health-tech-ai"],

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
    "Most review sites keep their scoring rules vague, which makes it impossible to tell an honest recommendation from a paid one. We take the opposite approach: the exact criteria and weights behind every Firsthand ranking are published on this page, and they apply to every product in a category — whether or not we have any financial relationship with its maker.",

  // Affiliate disclosure copied from AffiliateDisclosure.tsx (banner body).
  disclosureLabel: "Affiliate disclosure",
  disclosureBody:
    "Firsthand is reader-supported. We earn a commission if you buy through links on this page — at no extra cost to you. Commissions never influence our rankings.",

  // Medical disclaimer copied from MedicalDisclaimer.tsx.
  contentDisclaimer:
    "This content is for informational purposes only and is not medical advice. It is not intended to diagnose, treat, cure, or prevent any disease. Consult a healthcare professional before starting any supplement, treatment, or program — especially if you are pregnant, nursing, taking medication, or managing a health condition.",
  // Bold/aria label — VERBATIM "Medical disclaimer" from MedicalDisclaimer.tsx.
  contentDisclaimerLabel: "Medical disclaimer",

  // Health-specific tools.
  extras: {
    tools: [{ key: "sleep-quiz", label: "Sleep Quiz", path: "/quiz/sleep" }],
  },

  // Default byline + fact-check reviewer slugs (were hardcoded in hub/review
  // pages). Values match src/data/health/{authors,reviewers}.json exactly.
  defaultAuthorSlug: "health-research-analyst",
  defaultReviewerSlug: "editorial-team",

  // Footer copyright clause — VERBATIM from the previous Footer.tsx literal so
  // health output stays byte-identical.
  footerDisclaimer:
    "Firsthand content is for informational purposes only and is not medical advice.",

  // /methodology meta description — VERBATIM from the previous page metadata.
  methodologyMetaDescription:
    "The published methodology behind every Firsthand ranking: Safety, Evidence Quality, Cost & Value, Transparency, and Customer Support — with fixed weights that affiliate partnerships never change.",

  // Newsletter copy — VERBATIM from NewsletterBand.tsx / ArticleNewsletterCta.tsx.
  newsletter: {
    brandName: "The Firsthand Brief",
    bandBlurb:
      "One weekly email: what the newest health research actually says, and which products hold up. No hype, no spam.",
    ctaHeading: "Get evidence-based health picks in your inbox — no hype.",
    ctaBlurb: "Join The Firsthand Brief for a weekly, research-first read.",
  },

  // Homepage static content — VERBATIM from the previous page.tsx literals so
  // the health homepage renders byte-for-byte identically.
  homepage: {
    heroFallbackTitle: "Health decisions deserve better evidence.",
    heroFallbackBody:
      "Firsthand analyzes clinical research to rank supplements, telehealth providers, and health products — clearly and without hype.",
    trustHeading: "Why trust Firsthand",
    trustPoints: [
      "Rankings built from published clinical research, not sponsorships.",
      "Clear methodology on every comparison page.",
      "Medical review before any health claim is published.",
    ],
    rankingsLabel: "2026 editions",
    rankings: [
      {
        title: "Best Sleep Supplements 2026",
        category: "Sleep",
        blurb:
          "We scored the most-searched sleep supplements against published clinical evidence, dosing transparency, and third-party testing.",
        href: "/best/best-sleep-supplements",
      },
      {
        title: "Top GLP-1 Telehealth Providers 2026",
        category: "Weight Loss",
        blurb:
          "A side-by-side comparison of telehealth GLP-1 providers on clinical oversight, pricing clarity, and what your monthly fee actually includes.",
        href: "/best/best-glp1-telehealth-providers",
      },
      {
        title: "Best Whitening & Oral Health Picks 2026",
        category: "Dental & Oral Health",
        blurb:
          "Whitening kits and oral-care picks that hold up to dental research — and the popular ones that don't.",
        href: "/best/best-teeth-whitening-products",
      },
    ],
    latestPlaceholders: [
      {
        title: "Magnesium for Sleep: Separating Signal from Noise",
        category: "Nutrition & Supplements",
        excerpt:
          "Placeholder — a deep dive into the trial data behind magnesium's sleep claims arrives in a later step.",
        byline: "Firsthand Staff",
      },
      {
        title: "OTC Hearing Aids in 2026: What Changed and Who Benefits",
        category: "Hearing",
        excerpt:
          "Placeholder — our guide to the post-regulation OTC hearing-aid market arrives in a later step.",
        byline: "Firsthand Staff",
      },
    ],
    browseAllHref: "/category/health-news",
    browseAllLabel: "Browse all coverage →",
  },
};

export default health;
