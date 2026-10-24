import type { Vertical } from "./types";

/**
 * Tech vertical config — Firsthand Tech (tech.readfirsthand.com).
 *
 * Evidence-first technology product and software reviews. CRITICAL honesty
 * constraint: Firsthand does NOT run a hardware lab. Every rating and claim is
 * derived from analysis of primary documentation — manufacturer-published
 * specifications, official pricing pages, official security/audit documentation
 * (e.g. SOC 2, ISO 27001, FedRAMP), FCC filings, and publicly documented
 * third-party audits/certifications — NOT from independent hands-on lab testing
 * or benchmarking. The methodology copy, the reviewer bio, and every "Performance"
 * description below say this explicitly so no reader mistakes a spec-analysis
 * rating for a lab result. We never state a subjective quality judgment
 * ("best sound we heard") as if it came from testing.
 *
 * Brand consistency (like U.S. News): Tech shares the SAME Firsthand brand
 * palette as Health/Money for now. `theme` is read from this config wherever
 * brand tokens are wired, so differentiating later is a one-line change here.
 *
 * Keep this module free of Next.js imports (proxy/script-safe).
 */
export const tech: Vertical = {
  key: "tech",
  name: "Firsthand Tech",
  host: "readfirsthand.com",
  tagline: "Evidence-First Technology & Software Reviews",
  description:
    "Firsthand Tech is an independent technology review site. We read the primary documentation (manufacturer spec sheets, official pricing pages, and published security audits) to rank laptops, earbuds, apps, and other tech clearly and without hype. We do not run a hardware lab; our ratings come from analysis of published specifications and official documentation, not independent benchmarks.",

  // SAME shared Firsthand brand palette as Health/Money (brand consistency).
  theme: {
    brandNavy: "#0b3d6e",
    brandBlue: "#1a6fd4",
    brandMist: "#f1f5f9",
    brandInk: "#1e293b",
    brandWhite: "#ffffff",
  },

  navPrimaryCount: 6,

  // The tech-news section renders the timely news-list layout.
  newsCategorySlugs: ["tech-news"],

  categories: [
    "laptops",
    "smartphones",
    "wearables",
    "smart-home",
    "headphones-audio",
    "software-saas",
    "ai-tools",
    "tech-news",
  ],

  navCategories: [
    { name: "Laptops", slug: "laptops" },
    { name: "Smartphones", slug: "smartphones" },
    { name: "Wearables", slug: "wearables" },
    { name: "Smart Home", slug: "smart-home" },
    { name: "Headphones & Audio", slug: "headphones-audio" },
    { name: "Software & SaaS", slug: "software-saas" },
    { name: "AI Tools", slug: "ai-tools" },
    { name: "Tech News", slug: "tech-news" },
  ],

  // Five tech criteria. Keys match each product's `ratings` object keys and
  // CriterionRatings. Weights: Performance 30%, Value 25%, Reliability 20%,
  // Ease of Use 15%, Support 10% → sums to 1.00. Every "what we evaluate"
  // description is written honestly: assessment is from published specs and
  // documentation, NOT hands-on lab testing.
  criteria: [
    {
      key: "performance",
      label: "Performance",
      longLabel: "Performance",
      weight: 0.3,
      description:
        "Assessed from manufacturer-published specifications and documented capabilities (processors and silicon, battery ratings, noise-cancellation and connectivity claims, storage and throughput figures) not from independent lab benchmarks. We report manufacturer-rated figures as manufacturer-rated, cite them to the official spec sheet with an as-of date, and never present a subjective quality judgment as a test result.",
    },
    {
      key: "value",
      label: "Value",
      longLabel: "Value",
      weight: 0.25,
      description:
        "Official price versus what comparable products deliver for the money, always cited to the manufacturer's or company's official pricing page with an as-of date. Free tiers, subscription costs, bundled features, and recurring fees are weighed against alternatives that provide the same benefit; opaque or fast-rising pricing lowers the score.",
    },
    {
      key: "reliability",
      label: "Reliability",
      longLabel: "Reliability & Security",
      weight: 0.2,
      description:
        "For software: documented security posture: encryption, zero-knowledge architecture, and independent third-party audits or certifications (SOC 2, ISO 27001, FedRAMP) read from official documentation. For hardware: build and durability signals such as manufacturer water/dust (IP) ratings and warranty terms. We credit only what is documented, never assumed.",
    },
    {
      key: "ease_of_use",
      label: "Ease of Use",
      longLabel: "Ease of Use",
      weight: 0.15,
      description:
        "Setup friction, platform and cross-device availability, and how much of the advertised experience works without a specific phone or ecosystem: all drawn from official documentation and platform/availability listings. Ecosystem lock-in that gates advertised features to one vendor's devices lowers the score.",
    },
    {
      key: "support",
      label: "Support",
      longLabel: "Support & Warranty",
      weight: 0.1,
      description:
        "Published warranty length, documented return and refund policies, the breadth of official support channels, and update/security-patch commitments where the company states them. Clear, generous, and well-documented support scores highest.",
    },
  ],

  methodologyIntro:
    "Technology reviews are only as trustworthy as the evidence behind them, so we are explicit about ours. Firsthand Tech does not operate a hardware lab: we do not run independent benchmarks, and we do not conduct hands-on audio, battery, or performance testing. Instead, every rating is built from analysis of primary documentation: manufacturer-published specification sheets, official pricing pages, official security and audit documentation, FCC filings, and publicly documented third-party audits and certifications. Because specs and prices change, every number in our reviews is cited to a primary source with an 'as of' date, and where we cannot verify a figure we describe it qualitatively or omit it rather than guess. We never present a subjective judgment as if it came from testing we did not do.",

  disclosureLabel: "Affiliate Disclosure",
  disclosureBody:
    "Firsthand Tech is reader-supported. We may earn a commission if you buy through links on this page, at no extra cost to you. Commissions never affect our rankings, ratings, or which products we cover: placement follows the published methodology, not payment.",

  // General editorial disclaimer (replaces the medical/financial one).
  contentDisclaimer:
    "This content is for informational purposes only and is not professional advice. Specifications, prices, plan tiers, and features change frequently and may differ from what is shown here; verify current details on the manufacturer's or company's official page before purchasing. Ratings are based on analysis of published documentation, not independent lab testing.",
  contentDisclaimerLabel: "Editorial disclaimer",

  // No interactive tools/quiz for tech.

  defaultAuthorSlug: "technology-research-analyst",
  defaultReviewerSlug: "editorial-team",

  footerDisclaimer:
    "Firsthand Tech content is for informational purposes only and is not professional advice; ratings are based on published documentation, not independent lab testing.",

  methodologyMetaDescription:
    "The published methodology behind every Firsthand Tech ranking: Performance, Value, Reliability & Security, Ease of Use, and Support: rated from manufacturer specifications and official documentation, not independent lab testing.",

  newsletter: {
    brandName: "The Firsthand Tech Brief",
    bandBlurb:
      "One weekly email: what changed in the specs, prices, and security documentation behind the tech you use, read from the primary sources. No hype, no spam.",
    ctaHeading: "Get evidence-based tech picks in your inbox, no hype.",
    ctaBlurb: "Join The Firsthand Tech Brief for a weekly, research-first read.",
  },

  homepage: {
    heroFallbackTitle: "Tech decisions deserve better evidence.",
    heroFallbackBody:
      "Firsthand Tech reads the primary documentation (manufacturer spec sheets, official pricing pages, and published security audits) to rank laptops, earbuds, apps, and other tech clearly and without hype. We don't run a lab; our ratings come from published specifications and official documentation.",
    trustHeading: "Why trust Firsthand Tech",
    trustPoints: [
      "Rankings built from manufacturer specs and official documentation, not sponsorships.",
      "Clear methodology and cited, as-of-dated figures on every page, no invented benchmarks.",
      "We are explicit that we do not run independent lab testing; every review lists at least one genuine con.",
    ],
    rankingsLabel: "2026 editions",
    rankings: [
      {
        title: "Best Password Managers of 2026",
        category: "Software & SaaS",
        blurb:
          "We compared the leading password managers on official pricing, documented security audits and certifications, and platform support, with every price and claim cited to a primary source.",
        href: "/best/best-password-managers",
      },
      {
        title: "Best Wireless Earbuds of 2026",
        category: "Headphones & Audio",
        blurb:
          "A side-by-side look at flagship wireless earbuds using manufacturer-rated battery life, published specs, and official prices, reported as manufacturer-rated, not lab-tested.",
        href: "/best/best-wireless-earbuds",
      },
    ],
    latestPlaceholders: [],
    browseAllHref: "/category/tech-news",
    browseAllLabel: "Browse all coverage →",
  },
};

export default tech;
