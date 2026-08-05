/**
 * Firsthand symbol — "Ridgeline".
 *
 * Three fingerprint ridges release into three lines of text, the last stopping
 * short the way the last line of a paragraph does. The navy/blue split lands on
 * the arc-to-rule transition, so it matches the "First" / "hand" colour break in
 * the wordmark (src/components/Logo.tsx).
 *
 * `size="sm"` swaps in a simplified two-arc build at a heavier stroke — below
 * roughly 32px the three-arc version silts up and reads as a solid blob. Use it
 * anywhere the mark renders smaller than ~32px.
 *
 * Tones:
 *   duo      navy arcs + blue rules — the default, for light backgrounds
 *   mono     everything in currentColor — one-colour print, stamps, faxes
 *   reversed white arcs + pale blue rules — for navy/dark backgrounds
 */
export default function LogoMark({
  className = "",
  tone = "duo",
  size = "md",
}: {
  className?: string;
  tone?: "duo" | "mono" | "reversed";
  size?: "sm" | "md";
}) {
  const arc =
    tone === "reversed"
      ? "stroke-white"
      : tone === "mono"
        ? "stroke-current"
        : "stroke-brand-navy";
  const rule =
    tone === "reversed"
      ? "stroke-blue-300"
      : tone === "mono"
        ? "stroke-current"
        : "stroke-brand-blue";

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {size === "sm" ? (
        <g strokeWidth={10} strokeLinecap="round">
          <path className={arc} d="M14.3,55.6 A38,34 0 1 1 85.7,55.6" />
          <path className={arc} d="M31.2,50.2 A20,18 0 1 1 68.8,50.2" />
          <path className={rule} d="M10,72 H90" />
          <path className={rule} d="M10,89 H60" />
        </g>
      ) : (
        <g strokeWidth={6.5} strokeLinecap="round">
          <path className={arc} d="M12.4,57.8 A40,36 0 1 1 87.6,57.8" />
          <path className={arc} d="M22.7,54.4 A29,26 0 1 1 77.3,54.4" />
          <path className={arc} d="M33.1,51 A18,16 0 1 1 66.9,51" />
          <path className={rule} d="M10,69 H90" />
          <path className={rule} d="M10,80 H90" />
          <path className={rule} d="M10,91 H58" />
        </g>
      )}
    </svg>
  );
}
