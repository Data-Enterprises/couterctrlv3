import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import { formatUnits } from "./lookupMetrics";

interface Props {
  onSelect: (productCode: string) => void;
  /** Inside the result screen's bottom sheet the card shell is already there,
   *  so the list drops its own border and heading. */
  bare?: boolean;
}

/**
 * Recent lookups, dev only — see `lookupDevView.ts`.
 *
 * The five-column list this replaces gave the item description whatever was
 * left of a 375px screen after four fixed columns and four gaps: 75px, about
 * ten characters. "Picadeli Salad Bar" arrived as "Picadeli S…", so the one
 * column you choose a row by was the one that could not be read.
 *
 * Two lines instead, the same row `PerfDrillList` and the day list use — the
 * name gets the width, and the unit travels with the item rather than living
 * in a header two hundred pixels away.
 *
 * A scale item shows pounds. It rings `qty: 0`, so the old Qty column read
 * zero for everything sold by weight, and there was no weight on the entry to
 * fall back to until `units` was added to `RecentLookup`.
 */
const RecentLookupsCard = ({ onSelect, bare = false }: Props) => {
  const { recentLookups } = useAppSelector((s) => s.dev.item);
  if (!recentLookups.length) return null;

  const rows = (
    <div>
      {recentLookups.map((r, i) => {
        // Entries stored before these fields existed have neither, so they
        // fall back to the ring count rather than rendering undefined.
        const weighed = r.weighed ?? false;
        const units = r.units ?? r.qty;
        return (
          <button
            key={r.productCode}
            type="button"
            onClick={() => onSelect(r.productCode)}
            className={`block w-full border-t border-gray-100 px-3.5 py-2.5 text-left active:bg-bkg ${
              i === 0 ? "border-t-0" : ""
            } ${i % 2 === 1 ? "bg-row_stripe" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 flex-1 truncate font-display text-[13px] font-semibold text-content">
                {r.description}
              </span>
              <span className="flex-none text-[13px] font-bold text-content">
                {formatCurrency2(r.revenue)}
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-3 text-[11px] text-content/85">
              <span className="font-semibold">{r.productCode}</span>
              {units > 0 && (
                <span className="font-semibold text-content">
                  {formatUnits(units, weighed)}
                </span>
              )}
              {/* A missing cost is not a free item. Saying so beats "$0.00"
                  beside a margin computed from that same zero. */}
              {r.costMissing ? (
                <span>no cost</span>
              ) : (
                r.marginPct !== null && <span>{r.marginPct.toFixed(1)}% mgn</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  if (bare) return rows;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
      <div className="flex items-baseline justify-between gap-2 px-3.5 pb-1.5 pt-2.5">
        <span className="font-display text-[13.5px] font-semibold text-content">
          Recent lookups
        </span>
        <span className="text-[12px] text-content/85">
          {recentLookups.length}
        </span>
      </div>
      {rows}
    </section>
  );
};

export default RecentLookupsCard;
