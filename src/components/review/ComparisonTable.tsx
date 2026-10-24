import Link from "next/link";
import RatingBadge from "@/components/review/RatingBadge";
import { AFFILIATE_REL, affiliateHref, isAffiliatePlaceholder } from "@/lib/affiliate";
import type { Product } from "@/lib/types";
import { vHref } from "@/lib/site";

/**
 * Ranked comparison table for hub pages. Products must already be in rank
 * order (rank 1 first). Responsive via horizontal scroll on small screens.
 *
 * CTA rules: "Read review" always; "Check price" ONLY when monetized, with
 * rel="sponsored nofollow noopener" and target="_blank". Placeholder
 * affiliate URLs resolve to "#" (see src/lib/affiliate.ts).
 */
export default function ComparisonTable({
  products,
  className = "",
  verticalKey,
}: {
  products: Product[];
  className?: string;
  /** Which vertical this renders inside — links and config come from it. */
  verticalKey: string;
}) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-brand-mist ${className}`}>
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-brand-navy text-white">
            <th scope="col" className="px-4 py-3 font-semibold">
              #
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Product
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Rating
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Best for
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Price
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr
              key={p.id}
              className={i % 2 === 0 ? "bg-white" : "bg-brand-mist/60"}
            >
              <td className="px-4 py-3 font-serif text-lg font-bold text-brand-navy">
                {i + 1}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={vHref(verticalKey, `/reviews/${p.slug}`)}
                  className="font-semibold text-brand-navy hover:text-brand-blue hover:underline"
                >
                  {p.name}
                </Link>
                {!p.is_monetized && (
                  <span className="mt-0.5 block text-xs text-brand-ink/60">
                    Not an affiliate, no commission earned
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <RatingBadge score={p.rating_overall} size="sm" />
              </td>
              <td className="max-w-56 px-4 py-3 text-brand-ink/80">
                {p.best_for}
              </td>
              <td className="px-4 py-3 text-brand-ink/80">{p.price_summary}</td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-2">
                  {p.is_monetized && (
                    <a
                      href={affiliateHref(p.affiliate_url)}
                      target={
                        isAffiliatePlaceholder(p.affiliate_url)
                          ? undefined
                          : "_blank"
                      }
                      rel={AFFILIATE_REL}
                      className="inline-block rounded bg-brand-blue px-3 py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-brand-navy"
                    >
                      Check price
                    </a>
                  )}
                  <Link
                    href={vHref(verticalKey, `/reviews/${p.slug}`)}
                    className="inline-block rounded border border-brand-blue px-3 py-1.5 text-center text-xs font-semibold text-brand-blue transition-colors hover:bg-brand-mist"
                  >
                    Read review
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
