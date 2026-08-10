import { formatCurrency2 } from "../../../utils";
import SevBadge from "../../../components/SevBadge";
import {
  marginPct,
  NO_VENDOR_LABEL,
  type VendorRow,
  type VendorMetric,
  type VendorTier,
} from "../vendorsUtils";

/**
 * One vendor in the mobile list.
 *
 * Same three-part shape every graded mobile row uses — severity marker, name,
 * a TY/LW/LY column set, then a seven-day strip. See `SubDeptRowMobile`, which
 * this deliberately mirrors so the two pages read as one product.
 */

interface Props {
  row: VendorRow;
  tier: VendorTier;
  metric: VendorMetric;
  onClick: () => void;
}

const fmtPts = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)} pts`;
const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

const VendorRowMobile = ({ row, tier, metric, onClick }: Props) => {
  const isMargin = metric === "margin";

  /** Whichever number the toggle is showing. Margin is a percentage of a
   *  net/COGS pair; sales are the dollars themselves. */
  const value = (net: number, cogs: number) =>
    isMargin ? `${marginPct(net, cogs).toFixed(2)}%` : formatCurrency2(net);

  /** Points in margin mode, percent in sales mode — the same split
   *  `vendorDelta` makes, and the reason there's no shared formatter. */
  const delta = (
    twNet: number,
    twCogs: number,
    baseNet: number,
    baseCogs: number,
  ) =>
    isMargin
      ? fmtPts(marginPct(twNet, twCogs) - marginPct(baseNet, baseCogs))
      : fmtPct(baseNet > 0 ? ((twNet - baseNet) / baseNet) * 100 : 0);

  const deltaUp = (
    twNet: number,
    twCogs: number,
    baseNet: number,
    baseCogs: number,
  ) =>
    isMargin
      ? marginPct(twNet, twCogs) - marginPct(baseNet, baseCogs) >= 0
      : twNet >= baseNet;

  return (
    <button
      onClick={onClick}
      className="flex items-start w-full px-3 py-3 gap-3 bg-custom-white border-b border-gray-300 last:border-0 text-left active:bg-gray-50"
    >
      <SevBadge sev={tier} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-content truncate mb-1.5">
          {row.noVendor ? NO_VENDOR_LABEL : row.vendorName}
        </div>
        <div className="grid grid-cols-3 mb-1.5">
          <div className="px-1.5 py-1">
            <div className="text-[11px] text-content/85 uppercase tracking-wide">
              TY
            </div>
            <div className="text-[11px] font-medium text-content mt-0.5">
              {value(row.twNet, row.twCogs)}
            </div>
            <div className="text-[11px] text-content/85 mt-0.5">—</div>
          </div>
          <div className="px-1.5 py-1">
            <div className="text-[11px] text-content/85 uppercase tracking-wide">
              LW
            </div>
            <div className="text-[11px] font-medium text-content mt-0.5">
              {row.hasLW ? value(row.lwNet, row.lwCogs) : "—"}
            </div>
            {row.hasLW && (
              <div
                className={`text-[11px] font-medium mt-0.5 ${
                  deltaUp(
                    row.twNetForLW,
                    row.twCogsForLW,
                    row.lwNet,
                    row.lwCogs,
                  )
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {delta(row.twNetForLW, row.twCogsForLW, row.lwNet, row.lwCogs)}
              </div>
            )}
          </div>
          <div className="px-1.5 py-1">
            <div className="text-[11px] text-content/85 uppercase tracking-wide">
              LY
            </div>
            <div className="text-[11px] font-medium text-content mt-0.5">
              {row.hasLY ? value(row.lyNet, row.lyCogs) : "—"}
            </div>
            {row.hasLY && (
              <div
                className={`text-[11px] font-medium mt-0.5 ${
                  deltaUp(
                    row.twNetForLY,
                    row.twCogsForLY,
                    row.lyNet,
                    row.lyCogs,
                  )
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {delta(row.twNetForLY, row.twCogsForLY, row.lyNet, row.lyCogs)}
              </div>
            )}
          </div>
        </div>
        {/* Seven-day strip: each day against LY, or LW when this vendor has no
            LY — the same fallback the row's own tier uses, so the strip can't
            disagree with the badge beside it. Grey means neither side had that
            day, which is not the same as a day that went down. */}
        <div className="flex gap-0.5">
          {row.days.map((d) => {
            const label = new Date(d.date.split("T")[0] + "T12:00:00")
              .toLocaleDateString("en-US", { weekday: "short" })
              .slice(0, 1);
            const hasLY = d.lyNet !== null && d.lyNet > 0;
            const hasLW = d.lwNet !== null && d.lwNet > 0;
            const hasRef = hasLY || hasLW;
            const refNet = hasLY ? (d.lyNet as number) : (d.lwNet ?? 0);
            const refCogs = hasLY ? (d.lyCogs ?? 0) : (d.lwCogs ?? 0);
            const isUp = !hasRef
              ? true
              : isMargin
                ? marginPct(d.twNet, d.twCogs) >= marginPct(refNet, refCogs)
                : d.twNet >= refNet;
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

export default VendorRowMobile;
