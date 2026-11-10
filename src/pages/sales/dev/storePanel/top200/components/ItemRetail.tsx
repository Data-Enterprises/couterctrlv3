// Utils
import {
  retailSays,
  weighed,
  type pointsFor,
  type RetailMix,
  type TopItemCompared,
} from "../utils/topItems";
import { moneyText } from "../utils";

interface ItemRetailProps {
  selected: TopItemCompared;
  mix: RetailMix | null;
  points: ReturnType<typeof pointsFor>;
  topPrice: number | null;
}

/** What retail sold it at: the mix bar and the price ladder. */
const ItemRetail = ({ selected, mix, points, topPrice }: ItemRetailProps) => (
  <div
    data-help="item-retail"
    className="px-4 py-2.5 border-b border-gray-100"
  >
    <div className="text-[14px] font-bold text-content leading-snug">
      {retailSays(mix, points, moneyText)}
    </div>

    {mix && (
      <>
        <span className="flex h-2.5 rounded-sm overflow-hidden bg-bkg mt-2">
          <span
            className="bg-brand_navy"
            style={{ width: `${mix.regularPct}%` }}
          />
          <span
            className="bg-severity_watch_text"
            style={{ width: `${mix.adPct}%` }}
          />
          <span
            className="bg-severity_healthy_text"
            style={{ width: `${mix.tprPct}%` }}
          />
        </span>
        <div className="flex flex-wrap gap-x-3.5 gap-y-1 mt-1.5 text-[11.5px] text-content">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand_navy" />
            Reg {Math.round(mix.regularPct)}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-severity_watch_text" />
            Ad {Math.round(mix.adPct)}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-severity_healthy_text" />
            TPR {Math.round(mix.tprPct)}%
          </span>
        </div>
      </>
    )}

    <div className="grid grid-cols-[1fr_74px_84px] gap-2 mt-2.5 pb-1 border-b border-brand_navy/15 text-[10px] font-bold uppercase tracking-wide text-content/95">
      <span>Rang at</span>
      <span className="text-right">
        {weighed(selected.ty) ? "Pounds" : "Units"}
      </span>
      <span className="text-right">Sales</span>
    </div>
    {points.length === 0 ? (
      <p className="text-[11.5px] text-content/95 pt-1.5">
        No price came back for this item.
      </p>
    ) : (
      points.map((pt) => (
        <div
          key={pt.price}
          className="grid grid-cols-[1fr_74px_84px] gap-2 items-center py-1 border-b border-brand_navy/15 last:border-b-0 text-[11.5px] text-content tabular-nums"
        >
          <span className="text-[13px] font-semibold">
            {moneyText(pt.price)}
            {weighed(selected.ty) && (
              <span className="text-[11px] font-normal text-content/95">
                {" "}
                /lb
              </span>
            )}
          </span>
          <span className="text-right">
            {weighed(selected.ty) && pt.price > 0
              ? (pt.netSales / pt.price).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 1 },
                )
              : pt.units.toLocaleString()}
          </span>
          <span className="text-right">{moneyText(pt.netSales)}</span>
        </div>
      ))
    )}
    {topPrice !== null && (
      <div className="text-[11.5px] text-content/95 mt-1.5">
        Its highest price this week:{" "}
        <span className="font-semibold text-content">
          {moneyText(topPrice)}
        </span>
      </div>
    )}
  </div>
);

export default ItemRetail;
