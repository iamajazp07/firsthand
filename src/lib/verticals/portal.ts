import type { Vertical } from "./types";

/**
 * Portal "vertical" — the apex readfirsthand.com brand hub (health.readfirsthand.com,
 * money.readfirsthand.com, … all link back here).
 *
 * It is NOT a content vertical: it ships no categories, no rating criteria, and
 * no product seeds. It exists in the registry for one reason — so
 * `getActiveVertical()` does not crash when `NEXT_PUBLIC_VERTICAL=portal` (a
 * portal-mode build) and so `src/lib/site.ts` can derive the apex SITE_NAME /
 * SITE_URL / SITE_DESCRIPTION from a single config object, exactly like every
 * other vertical.
 *
 * The portal PAGE (src/app/portal/page.tsx) reads `VERTICALS` directly to render
 * one card per live content vertical, so it renders correctly regardless of the
 * build's active vertical (a health-mode deployment serves it on the apex via a
 * proxy rewrite). Keep this module free of Next.js imports (proxy/script-safe).
 */
export const portal: Vertical = {
  key: "portal",
  name: "Firsthand",
  host: "readfirsthand.com",
  tagline: "Independent, evidence-first reviews and rankings",
  description:
    "Firsthand publishes independent, evidence-first reviews and rankings — clear analysis and transparent methodology across health and, soon, more. No hype, no pay-to-play.",

  // Same brand tokens as the content verticals so shared chrome stays on-brand.
  theme: {
    brandNavy: "#0b3d6e",
    brandBlue: "#1a6fd4",
    brandMist: "#f1f5f9",
    brandInk: "#1e293b",
    brandWhite: "#ffffff",
  },

  // The portal has no category nav of its own.
  navPrimaryCount: 0,
  categories: [],
  navCategories: [],

  // No product scoring on the portal.
  criteria: [],
  methodologyIntro: "",

  // Legal/compliance copy is per-content-vertical; the portal links out to the
  // vertical subdomains for those pages, so these are intentionally empty.
  disclosureLabel: "Affiliate disclosure",
  disclosureBody: "",
  contentDisclaimer: "",
};

export default portal;
