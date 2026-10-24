import type { Vertical } from "./types";

/**
 * Education vertical config — Firsthand Education (education.readfirsthand.com).
 *
 * Evidence-first reviews and rankings of learning programs and education tools.
 * Education overlaps YMYL (career and financial outcomes), so the honesty bar is
 * high. CRITICAL honesty constraint: Firsthand does NOT independently audit
 * schools or programs and does NOT conduct student surveys. Every rating is
 * built from analysis of officially published data — accreditor databases
 * (e.g. the U.S. Department of Education's DAPIP, CHEA), U.S. Department of
 * Education sources (College Scorecard), the Bureau of Labor Statistics, and
 * each provider's own official pricing, curriculum, and outcomes documentation.
 * Where a provider's outcome numbers are self-reported and unaudited, they are
 * clearly attributed as self-reported (or omitted), never presented as
 * independently verified. Prices change, so every figure is cited to a primary
 * source with an "as of" date; where a figure cannot be verified we describe it
 * qualitatively or omit it rather than guess.
 *
 * Brand consistency (like U.S. News): Education shares the SAME Firsthand brand
 * palette as Health/Money/Tech for now. `theme` is read from this config
 * wherever brand tokens are wired, so differentiating later is a one-line change.
 *
 * Keep this module free of Next.js imports (proxy/script-safe).
 */
export const education: Vertical = {
  key: "education",
  name: "Firsthand Education",
  host: "readfirsthand.com",
  tagline: "Evidence-First Reviews of Learning Programs & Education Tools",
  description:
    "Firsthand Education is an independent education review site. We read the official record: accreditor databases, U.S. Department of Education sources, and each provider's own published pricing, curriculum, and outcomes documentation: to rank online learning platforms, bootcamps, certifications, and study tools clearly and without hype. We do not audit schools or survey students; our ratings analyze published data, not independent audits.",

  // SAME shared Firsthand brand palette as Health/Money/Tech (brand consistency).
  theme: {
    brandNavy: "#0b3d6e",
    brandBlue: "#1a6fd4",
    brandMist: "#f1f5f9",
    brandInk: "#1e293b",
    brandWhite: "#ffffff",
  },

  navPrimaryCount: 6,

  // The education-news section renders the timely news-list layout.
  newsCategorySlugs: ["education-news"],

  categories: [
    "online-learning-platforms",
    "coding-bootcamps",
    "professional-certifications",
    "test-prep",
    "language-learning",
    "online-degrees",
    "study-tools",
    "education-news",
  ],

  navCategories: [
    { name: "Online Learning Platforms", slug: "online-learning-platforms" },
    { name: "Coding Bootcamps", slug: "coding-bootcamps" },
    { name: "Professional Certifications", slug: "professional-certifications" },
    { name: "Test Prep", slug: "test-prep" },
    { name: "Language Learning", slug: "language-learning" },
    { name: "Online Degrees", slug: "online-degrees" },
    { name: "Study Tools", slug: "study-tools" },
    { name: "Education News", slug: "education-news" },
  ],

  // Five education criteria. Keys match each product's `ratings` object keys and
  // CriterionRatings. Weights: Outcomes 30%, Cost & Value 25%, Academics 20%,
  // Support Services 15%, Flexibility 10% → sums to 1.00. Every "what we
  // evaluate" description is written honestly: assessment is from officially
  // published or provider-disclosed data, clearly labeled when self-reported,
  // NOT from Firsthand-conducted audits or student surveys.
  criteria: [
    {
      key: "outcomes",
      label: "Outcomes",
      longLabel: "Outcomes",
      weight: 0.3,
      description:
        "What the credential or program is designed to lead to, and what the officially published or provider-disclosed data shows. We read outcomes evidence from primary sources: the U.S. Department of Education's College Scorecard, accreditor databases, and, for bootcamps, standardized reports (e.g. CIRR). When a provider's completion, placement, or salary figures are self-reported and not independently audited, we say so explicitly and never present them as verified. Firsthand does not survey students or audit outcomes; where a figure cannot be verified from a primary source we describe it qualitatively or omit it.",
    },
    {
      key: "cost_value",
      label: "Cost & Value",
      longLabel: "Cost & Value",
      weight: 0.25,
      description:
        "Official price versus what the program delivers, always cited to the provider's own published pricing page with an as-of date. Free tiers, subscription costs, one-time fees, financing terms, and what is included (certificates, graded work, mentorship) are weighed against alternatives that deliver the same benefit. Opaque, fast-changing, or promotion-dependent pricing lowers the score; genuinely free access from a nonprofit is credited.",
    },
    {
      key: "academics",
      label: "Academics",
      longLabel: "Academic Quality",
      weight: 0.2,
      description:
        "The substance of the learning experience as documented: curriculum depth and structure, the credibility of the institutions or instructors behind it, accreditation or recognized-credential status where it applies, and how the material is taught. We credit accreditation only when we can confirm it in an accreditor database or the Department of Education's DAPIP, and we distinguish a certificate of completion from an accredited credential.",
    },
    {
      key: "support_services",
      label: "Support Services",
      longLabel: "Support Services",
      weight: 0.15,
      description:
        "The documented support around the learning: instructor or mentor access, feedback and grading, community and peer review, career services where offered, and the breadth of published help and refund policies. We credit only what the provider documents, and we note when a valued feature (e.g. graded assignments, mentorship, community feedback) is gated behind a higher-priced tier.",
    },
    {
      key: "flexibility",
      label: "Flexibility",
      longLabel: "Flexibility & Access",
      weight: 0.1,
      description:
        "How easily a learner can fit the program into real life: self-paced versus cohort schedules, mobile and offline access, device and platform availability, language options, and how much of the advertised experience works without a specific device or subscription tier: all drawn from official documentation.",
    },
  ],

  methodologyIntro:
    "Education reviews carry real weight because they touch careers and money, so we are explicit about our evidence. Firsthand Education does not independently audit schools or programs, and it does not conduct student surveys. Instead, every rating is built from analysis of officially published data: accreditor databases and the U.S. Department of Education's Database of Accredited Postsecondary Institutions and Programs (DAPIP), U.S. Department of Education sources such as College Scorecard, the Bureau of Labor Statistics, and each provider's own published pricing, curriculum, accreditation, and outcomes documentation. Because prices and programs change, every number in our reviews is cited to a primary source with an 'as of' date, and where we cannot verify a figure we describe it qualitatively or omit it rather than guess. When a provider's completion, placement, or salary numbers are self-reported and unaudited, we label them as self-reported and never present them as independently verified.",

  disclosureLabel: "Affiliate Disclosure",
  disclosureBody:
    "Firsthand Education is reader-supported. We may earn a commission if you enroll or subscribe through links on this page, at no extra cost to you. Commissions never affect our rankings, ratings, or which programs we cover: placement follows the published methodology, not payment.",

  // Not-academic/career/financial-advice content disclaimer.
  contentDisclaimer:
    "This content is for informational purposes only and is not academic, career, or financial advice. Program details, pricing, accreditation status, and outcomes change frequently and may differ from what is shown here; verify current details with the provider and official sources (such as the provider's site, accreditor databases, and the U.S. Department of Education) before enrolling.",
  contentDisclaimerLabel: "Education disclaimer",

  // No interactive tools/quiz for education (the sleep quiz is health-only).

  defaultAuthorSlug: "education-research-analyst",
  defaultReviewerSlug: "editorial-team",

  footerDisclaimer:
    "Firsthand Education content is for informational purposes only and is not academic, career, or financial advice; ratings are based on published data, not independent audits of schools or programs.",

  methodologyMetaDescription:
    "The published methodology behind every Firsthand Education ranking: Outcomes, Cost & Value, Academics, Support Services, and Flexibility: rated from officially published data and provider documentation, not independent audits or student surveys.",

  newsletter: {
    brandName: "The Firsthand Education Brief",
    bandBlurb:
      "One weekly email: what changed in the pricing, accreditation, and published outcomes behind the learning programs and tools you're considering, read from the primary sources. No hype, no spam.",
    ctaHeading: "Get evidence-based education picks in your inbox, no hype.",
    ctaBlurb:
      "Join The Firsthand Education Brief for a weekly, research-first read.",
  },

  homepage: {
    heroFallbackTitle: "Education decisions deserve better evidence.",
    heroFallbackBody:
      "Firsthand Education reads the official record: accreditor databases, U.S. Department of Education sources, and each provider's own published pricing, curriculum, and outcomes documentation: to rank online learning platforms, bootcamps, certifications, and study tools clearly and without hype. We don't audit schools or survey students; our ratings come from published data.",
    trustHeading: "Why trust Firsthand Education",
    trustPoints: [
      "Rankings built from officially published data and provider documentation, not sponsorships.",
      "Clear methodology and cited, as-of-dated figures on every page: self-reported outcomes are labeled as self-reported.",
      "We are explicit that we do not audit schools or survey students; every review lists at least one genuine con.",
    ],
    rankingsLabel: "2026 editions",
    rankings: [
      {
        title: "Best Online Learning Platforms of 2026",
        category: "Online Learning Platforms",
        blurb:
          "We compared the leading online learning platforms on official pricing, published curriculum and credentialing, and support, with every price and claim cited to a primary source.",
        href: "/best/best-online-learning-platforms",
      },
      {
        title: "Best Language Learning Apps of 2026",
        category: "Language Learning",
        blurb:
          "A side-by-side look at the major language-learning apps using official pricing, documented methods and features, and free-tier limits, reported from each app's own documentation, not efficacy marketing.",
        href: "/best/best-language-learning-apps",
      },
    ],
    latestPlaceholders: [],
    browseAllHref: "/category/education-news",
    browseAllLabel: "Browse all coverage →",
  },
};

export default education;
