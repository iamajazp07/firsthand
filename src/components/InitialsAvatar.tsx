/**
 * Clean generated placeholder avatar: initials on a navy circle (inline SVG).
 * Used for authors/reviewers until real photos exist — easy to swap by
 * setting photo_url in the data.
 */
export default function InitialsAvatar({
  name,
  size = 48,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={`${name} avatar`}
      className={className}
    >
      <circle cx="24" cy="24" r="24" fill="#0b3d6e" />
      <text
        x="24"
        y="25"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="18"
        fontWeight="600"
      >
        {initials}
      </text>
    </svg>
  );
}
