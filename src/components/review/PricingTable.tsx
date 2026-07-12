import type { PricingPlan } from "@/lib/types";

/** Simple plan / price / notes table for spoke pages. */
export default function PricingTable({
  rows,
  className = "",
}: {
  rows: PricingPlan[];
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-brand-mist ${className}`}>
      <table className="w-full min-w-[480px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-brand-navy text-white">
            <th scope="col" className="px-4 py-2.5 font-semibold">
              Plan
            </th>
            <th scope="col" className="px-4 py-2.5 font-semibold">
              Price
            </th>
            <th scope="col" className="px-4 py-2.5 font-semibold">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.plan}
              className={i % 2 === 0 ? "bg-white" : "bg-brand-mist/60"}
            >
              <td className="px-4 py-2.5 font-semibold text-brand-navy">
                {row.plan}
              </td>
              <td className="px-4 py-2.5 text-brand-ink/90">{row.price}</td>
              <td className="px-4 py-2.5 text-brand-ink/80">{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
