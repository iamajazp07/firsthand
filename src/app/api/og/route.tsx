/**
 * Dynamic Open Graph image — /api/og?title=...&kind=article|hub|review
 *
 * Renders a clean 1200×630 branded card with next/og (ImageResponse / Satori):
 *   - white background, a navy top band + navy hairline border,
 *   - the "Firsthand" wordmark (Viva navy + hale blue),
 *   - a small kind label (ANALYSIS / RANKINGS / REVIEW),
 *   - the title in large bold,
 *   - the readfirsthand.com host line.
 *
 * No external images or fonts are required — Satori's bundled default font is
 * used, so the endpoint works offline and in local/CI builds. This single
 * reusable route backs the og:image for /articles, /best, and /reviews.
 */

import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/site";

// Brand tokens (mirror of the @theme values in globals.css).
const NAVY = "#0B3D6E";
const BLUE = "#1A6FD4";
const MIST = "#F1F5F9";
const INK = "#1E293B";

// Host line shown on the OG card, derived from the active vertical's SITE_URL
// (health → health.readfirsthand.com) so cards match the canonical host.
const OG_HOST = SITE_URL.replace(/^https?:\/\//, "");

type Kind = "article" | "hub" | "review";

const KIND_LABEL: Record<Kind, string> = {
  article: "ANALYSIS",
  hub: "RANKINGS",
  review: "REVIEW",
};

function coerceKind(raw: string | null): Kind {
  if (raw === "hub" || raw === "review" || raw === "article") return raw;
  return "article";
}

export function GET(request: Request): ImageResponse {
  const { searchParams } = new URL(request.url);
  const rawTitle = (searchParams.get("title") ?? "").trim();
  // Keep the card readable: clamp very long titles.
  const title =
    rawTitle.length > 120 ? `${rawTitle.slice(0, 117)}…` : rawTitle || "Firsthand";
  const kind = coerceKind(searchParams.get("kind"));

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          border: `2px solid ${NAVY}`,
          fontFamily: "sans-serif",
        }}
      >
        {/* Navy top band with the wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: NAVY,
            padding: "34px 56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 46, fontWeight: 700, color: "#FFFFFF" }}>
              Viva
            </span>
            <span style={{ fontSize: 46, fontWeight: 700, color: "#8EC0FF" }}>
              hale
            </span>
          </div>
          <span
            style={{
              fontSize: 20,
              letterSpacing: 3,
              color: "#BBD3F0",
              fontWeight: 600,
            }}
          >
            HEALTH &amp; WELLNESS REVIEWS
          </span>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "center",
            padding: "56px 56px 40px 56px",
          }}
        >
          <div style={{ display: "flex", marginBottom: 28 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 4,
                color: BLUE,
                backgroundColor: MIST,
                padding: "10px 20px",
                borderRadius: 8,
              }}
            >
              {KIND_LABEL[kind]}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 70 ? 56 : 68,
              fontWeight: 700,
              lineHeight: 1.15,
              color: NAVY,
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `4px solid ${BLUE}`,
            padding: "26px 56px",
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 600, color: INK }}>
            {OG_HOST}
          </span>
          <span style={{ fontSize: 22, color: "#64748B" }}>
            Independent · Evidence-based · No hype
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
