import { formatCurrency2 } from "../../../utils";
import SevBadge from "../../../components/SevBadge";
import type {
  CategoryRow,
  CategoryMetric,
  CategoryTier,
} from "../categoriesUtils";

/**
 * One category in the mobile list — the same shape as `VendorRowMobile` and
 * `SubDeptRowMobile`: severity marker, name, a TY/LW/LY column set, then a
 * seven-day strip.
 */

interface Props {
  row: CategoryRow;
  tier: CategoryTier;
  metric: CategoryMetric;
  onClick: () => void;
}

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

const CategoryRowMobile = ({ row, tier, metric, onClick }: Props) => {
  const isQty = metric === "qty";
  const show = (net: number, qty: number) =>
    isQty ? `${qty.toLocaleString()} u` : formatCurrency2(net);

  /** Percent change on whichever measure the toggle is showing. */
  const pct = (tw: number, prior: number) =>
    prior > 0 ? ((tw - prior) / prior) * 100 : 0;

  const lwPct = pct(
    isQty ? row.twQtyForLW : row.twNetForLW,
    isQty ? row.lwQty : row.lwNet,
  );
  const lyPct = pct(
    isQty ? row.twQtyForLY : row.twNetForLY,
    isQty ? row.lyQty : row.lyNet,
  );

  return (
    <button
      onClick={onClick}
      className="flex items-start w-full px-3 py-3 gap-3 bg-custom-white border-b border-gray-300 last:border-0 text-left active:bg-gray-50"
    >
      <SevBadge sev={tier} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-content truncate mb-1.5">
          {row.uncategorized
            ? "Uncategorized"
            : (row.description ?? `Category ${row.category}`)}
        </div>
        <div className="grid grid-cols-3 mb-1.5">
          <div className="px-1.5 py-1">
            <div className="text-[11px] text-content/85 uppercase tracking-wide">
              TY
            </div>
            <div className="text-[11px] font-medium text-content mt-0.5">
              {show(row.twNet, row.twQty)}
            </div>
            <div className="text-[11px] text-content/85 mt-0.5">—</div>
          </div>
          <div className="px-1.5 py-1">
            <div className="text-[11px] text-content/85 uppercase tracking-wide">
              LW
            </div>
            <div className="text-[11px] font-medium text-content mt-0.5">
              {row.hasLW ? show(row.lwNet, row.lwQty) : "—"}
            </div>
            {row.hasLW && (
              <div
                className={`text-[11px] font-medium mt-0.5 ${lwPct >= 0 ? "text-emerald-600" : "text-red-500"}`}
              >
                {fmtPct(lwPct)}
              </div>
            )}
          </div>
          <div className="px-1.5 py-1">
            <div className="text-[11px] text-content/85 uppercase tracking-wide">
              LY
            </div>
            <div className="text-[11px] font-medium text-content mt-0.5">
              {row.hasLY ? show(row.lyNet, row.lyQty) : "—"}
            </div>
            {row.hasLY && (
              <div
                className={`text-[11px] font-medium mt-0.5 ${lyPct >= 0 ? "text-emerald-600" : "text-red-500"}`}
              >
                {fmtPct(lyPct)}
              </div>
            )}
          </div>
        </div>
        {/* Seven-day strip: each day against LY, or LW when there's no LY —
            the same fallback the row's own tier uses, so the strip can't
            disagree with the badge beside it. Grey means neither side had that
            day, which is not the same as a day that fell. */}
        <div className="flex gap-0.5">
          {row.days.map((d) => {
            const label = new Date(d.date + "T12:00:00")
              .toLocaleDateString("en-US", { weekday: "short" })
              .slice(0, 1);
            const lyVal = isQty ? d.lyQty : d.lyNet;
            const lwVal = isQty ? d.lwQty : d.lwNet;
            const twVal = isQty ? d.twQty : d.twNet;
            const hasLY = lyVal !== null && lyVal > 0;
            const hasLW = lwVal !== null && lwVal > 0;
            const hasRef = hasLY || hasLW;
            const ref = hasLY ? (lyVal as number) : (lwVal ?? 0);
            const isUp = !hasRef ? true : twVal >= ref;
            return (
              <div
                key={d.date}
                className={`w-6 h-[18px] rounded text-[10px] font-bold flex items-center justify-center ${
                  !hasRef
                    ? "bg-gray-200 text-gray-400"
                    : isUp
                      ? "bg-emerald-400 text-custom-white"
                      : "bg-red-400 text-custom-white"
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
};

export default CategoryRowMobile;
