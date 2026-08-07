/**
 * Dynamic Open Graph image — /api/og?title=...&kind=article|hub|review
 *
 * Renders a clean 1200×630 branded card with next/og (ImageResponse / Satori):
 *   - white background, a navy top band + navy hairline border,
 *   - the Ridgeline mark + "Firsthand" wordmark, reversed on the navy band,
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

/**
 * The Ridgeline mark, reversed (white arcs + pale blue rules) for the navy
 * band. Inlined as a data URI because Satori cannot fetch relative URLs at
 * render time and this route must keep working offline and in CI.
 * Source: public/brand/firsthand-mark-reversed.svg — keep the two in sync.
 */
const MARK_REVERSED =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZmlsbD0ibm9uZSI+CjxnIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iNi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiPgo8cGF0aCBzdHJva2U9IiNGRkZGRkYiIGQ9Ik0xMi40LDU3LjggQTQwLDM2IDAgMSAxIDg3LjYsNTcuOCIvPgo8cGF0aCBzdHJva2U9IiNGRkZGRkYiIGQ9Ik0yMi43LDU0LjQgQTI5LDI2IDAgMSAxIDc3LjMsNTQuNCIvPgo8cGF0aCBzdHJva2U9IiNGRkZGRkYiIGQ9Ik0zMy4xLDUxIEExOCwxNiAwIDEgMSA2Ni45LDUxIi8+CjxwYXRoIHN0cm9rZT0iIzdGQjRGNSIgZD0iTTEwLDY5IEg5MCIvPgo8cGF0aCBzdHJva2U9IiM3RkI0RjUiIGQ9Ik0xMCw4MCBIOTAiLz4KPHBhdGggc3Ryb2tlPSIjN0ZCNEY1IiBkPSJNMTAsOTEgSDU4Ii8+PC9nPgo8L3N2Zz4K";

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
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARK_REVERSED} width={58} height={58} alt="" />
            <div style={{ display: "flex", alignItems: "baseline", marginLeft: 18 }}>
              <span style={{ fontSize: 46, fontWeight: 700, color: "#FFFFFF" }}>
                First
              </span>
              <span style={{ fontSize: 46, fontWeight: 700, color: "#8EC0FF" }}>
                hand
              </span>
            </div>
          </div>
          <span
            style={{
              fontSize: 20,
              letterSpacing: 3,
              color: "#BBD3F0",
              fontWeight: 600,
            }}
          >
            INDEPENDENT REVIEWS &amp; RANKINGS
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
