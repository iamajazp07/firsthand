import type { Vertical } from "./types";

/**
 * Money vertical config — Firsthand Money (money.readfirsthand.com).
 *
 * YMYL (Your-Money-or-Your-Life) content: the disclosure/disclaimer copy below
 * is deliberately strict. Firsthand Money publishes evidence-first personal-
 * finance reviews and rankings; it is NOT a financial advisor and employs no
 * CFP/CFA/licensed advisor. Every number in the seeds traces to a primary
 * source (bank/issuer official disclosure, or a regulator: CFPB, FDIC, NCUA,
 * SEC, FINRA, IRS, Federal Reserve).
 *
 * Brand consistency (like U.S. News): Money shares the SAME Firsthand brand
 * palette as Health for now. `theme` is read from this config wherever brand
 * tokens are wired, so differentiating later is a one-line change here.
 *
 * Keep this module free of Next.js imports (proxy/script-safe).
 */
export const money: Vertical = {
  key: "money",
  name: "Firsthand Money",
  host: "readfirsthand.com",
  tagline: "Evidence-First Personal Finance Reviews",
  description:
    "Firsthand Money is an independent personal-finance review site. We read primary disclosures — bank rate and fee schedules, official pricing pages, and regulator publications — to rank savings accounts, budgeting apps, and money tools clearly and without hype.",

  // SAME shared Firsthand brand palette as Health (brand consistency for now).
  theme: {
    brandNavy: "#0b3d6e",
    brandBlue: "#1a6fd4",
    brandMist: "#f1f5f9",
    brandInk: "#1e293b",
    brandWhite: "#ffffff",
  },

  navPrimaryCount: 6,

  // The money-news section renders the timely news-list layout.
  newsCategorySlugs: ["money-news"],

  categories: [
    "high-yield-savings",
    "budgeting-apps",
    "credit-cards",
    "brokerages-investing",
    "personal-loans",
    "tax-software",
    "money-news",
  ],

  navCategories: [
    { name: "High-Yield Savings", slug: "high-yield-savings" },
    { name: "Budgeting Apps", slug: "budgeting-apps" },
    { name: "Credit Cards", slug: "credit-cards" },
    { name: "Brokerages & Investing", slug: "brokerages-investing" },
    { name: "Personal Loans", slug: "personal-loans" },
    { name: "Tax Software", slug: "tax-software" },
    { name: "Money News", slug: "money-news" },
  ],

  // Five money criteria. Keys match each product's `ratings` object keys and
  // CriterionRatings. Weights: Fees 25%, Value & Returns 25%, Transparency 20%,
  // Security & Trust 15%, Support 15% → sums to 1.00.
  criteria: [
    {
      key: "fees",
      label: "Fees",
      longLabel: "Fees",
      weight: 0.25,
      description:
        "Monthly maintenance fees, minimums, and the avoidable and unavoidable charges disclosed in the provider's official fee schedule — overdraft, transfer, early-withdrawal, origination, and subscription costs. Lower and clearer wins; buried or hard-to-avoid fees lower the score.",
    },
    {
      key: "value_returns",
      label: "Value & Returns",
      longLabel: "Value & Returns",
      weight: 0.25,
      description:
        "For deposit accounts, the APY relative to peers (always cited as-of a date, since rates are variable); for tools and apps, the value delivered for the price. We compare against alternatives that deliver the same benefit, and we never treat a teaser rate as a guarantee.",
    },
    {
      key: "transparency",
      label: "Transparency",
      longLabel: "Transparency",
      weight: 0.2,
      description:
        "How clearly the provider discloses rates, fees, and terms up front. Published fee schedules, plain-language APY and APR terms, no hidden minimums, and honest marketing that does not bury the conditions score highest.",
    },
    {
      key: "security_trust",
      label: "Security & Trust",
      longLabel: "Security & Trust",
      weight: 0.15,
      description:
        "FDIC or NCUA insurance for deposit products (confirmed at the institution level), plus data-security posture for apps — encryption, read-only account aggregation, multi-factor authentication, and a clear stance on not selling customer data, sourced from official documentation.",
    },
    {
      key: "support",
      label: "Support",
      longLabel: "Customer Support & Experience",
      weight: 0.15,
      description:
        "Availability and quality of customer support, account-servicing friction, complaint history where public (e.g. CFPB complaint database), and the real-world experience of opening, using, and closing the account.",
    },
  ],

  methodologyIntro:
    "Personal-finance content is only as trustworthy as its sources, so we publish ours. The exact criteria and weights behind every Firsthand Money ranking are on this page, and they apply to every provider in a category — whether or not we have any financial relationship with it. Rates and fees change, so every number in our reviews is cited to a primary source with an 'as of' date, and we describe a figure qualitatively rather than guess when we cannot verify it.",

  // Advertiser-disclosure language (replaces the health "Affiliate disclosure").
  disclosureLabel: "Advertiser Disclosure",
  disclosureBody:
    "Firsthand Money is reader-supported. We may earn compensation from some of the partners whose products appear on this page — at no extra cost to you. That compensation never affects our rankings, ratings, or which products we cover: placement follows the published methodology, not payment.",

  // Not-financial-advice content disclaimer (replaces the medical disclaimer).
  contentDisclaimer:
    "This content is for informational purposes only and is not financial, investment, tax, or legal advice. Rates, fees, and terms change and may differ from what is shown here; verify current details with the provider before acting. Consider consulting a qualified financial professional about your specific situation.",
  contentDisclaimerLabel: "Financial disclaimer",

  // No interactive tools/quiz for money (the sleep quiz is health-only).

  defaultAuthorSlug: "consumer-finance-analyst",
  defaultReviewerSlug: "editorial-team",

  footerDisclaimer:
    "Firsthand Money content is for informational purposes only and is not financial, investment, tax, or legal advice.",

  methodologyMetaDescription:
    "The published methodology behind every Firsthand Money ranking: Fees, Value & Returns, Transparency, Security & Trust, and Customer Support — with fixed weights that advertiser compensation never changes.",

  newsletter: {
    brandName: "The Firsthand Money Brief",
    bandBlurb:
      "One weekly email: what changed in savings rates, fees, and money tools — read from the primary sources. No hype, no spam.",
    ctaHeading: "Get evidence-based money picks in your inbox — no hype.",
    ctaBlurb: "Join The Firsthand Money Brief for a weekly, research-first read.",
  },

  homepage: {
    heroFallbackTitle: "Money decisions deserve better evidence.",
    heroFallbackBody:
      "Firsthand Money reads the primary disclosures — bank rate and fee schedules, official pricing pages, and regulator publications — to rank savings accounts, budgeting apps, and money tools clearly and without hype.",
    trustHeading: "Why trust Firsthand Money",
    trustPoints: [
      "Rankings built from primary financial disclosures, not sponsorships.",
      "Clear methodology and cited, as-of-dated numbers on every page.",
      "Editorial fact-checking against the cited source before anything is published.",
    ],
    rankingsLabel: "2026 editions",
    rankings: [
      {
        title: "Best High-Yield Savings Accounts 2026",
        category: "High-Yield Savings",
        blurb:
          "We compared FDIC-insured online savings accounts on fees, variable APYs (cited as-of date), transparency, and account servicing.",
        href: "/best/best-high-yield-savings-accounts",
      },
      {
        title: "Best Budgeting Apps 2026",
        category: "Budgeting Apps",
        blurb:
          "A side-by-side look at the leading budgeting apps on price, features, data security, and the value they deliver for the subscription.",
        href: "/best/best-budgeting-apps",
      },
    ],
    latestPlaceholders: [],
    browseAllHref: "/category/money-news",
    browseAllLabel: "Browse all coverage →",
  },
};

export default money;
