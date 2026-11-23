// Utils
import { formatCurrency2 } from "../../../../../utils";
import { EXCEPTION_LABEL, TIER_STRIPE } from "../../utils/forecastRanking";
import { COLS } from "../../utils";

// Interfaces
import type { ForecastOutlierRow } from "../../../../../features/forecastDevSlice";
import type { Exception, RankEntry } from "../../interfaces";

interface ForecastRowProps {
  row: ForecastOutlierRow;
  entry: RankEntry | undefined;
  /** The forecast's reliability or cost flags for this item. */
  flags: Exception[];
  /** The applied price was typed, so the history columns don't apply. */
  customPriced: boolean;
  onOpen: () => void;
}

/** One item in the grid: rank, description, UPC and its flags, notes, then
 *  the history and forecast figures. Double-click opens the calculator. */
const ForecastRow = ({
  row,
  entry,
  flags,
  customPriced,
  onOpen,
}: ForecastRowProps) => (
  <div
    onDoubleClick={onOpen}
    title={
      row.singlePrice
        ? "Only one price point — nothing to model"
        : "Double-click for the calculator"
    }
    className={`grid gap-2.5 items-center pl-1.5 pr-2 py-[7px] border-b border-brand_navy/15 last:border-b-0 border-l-4 ${
      entry ? TIER_STRIPE[entry.tier] : "border-l-transparent"
    } ${row.singlePrice ? "" : "even:bg-row_stripe hover:bg-fill_soft"}`}
    style={{ gridTemplateColumns: COLS }}
  >
    <div className="min-w-0 flex items-baseline gap-2">
      <span className="flex items-baseline gap-1.5 flex-shrink-0">
        <span className="text-[14px] font-bold tabular-nums text-content w-6 text-right">
          {entry?.rank ?? ""}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-content truncate flex items-center gap-1">
          <span className="truncate">{row.description}</span>
          {row.adListData && (
            <span className="shrink-0 text-[9px] bg-brand_navy text-custom-white rounded px-0.5 font-medium">
              AD
            </span>
          )}
        </div>
        {/* Badges sit on the UPC line, so the description
            keeps the full width. */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-medium text-content/95 tabular-nums flex-shrink-0">
            {row.upc}
          </span>
          {row.singlePrice && (
            <span className="flex-shrink-0 text-[11px] bg-severity_watch_bg text-severity_watch_text rounded px-1 font-medium">
              1pt
            </span>
          )}
          {flags.length > 0 && (
            <span
              title={flags.map((f) => f.detail).join("\n")}
              className="truncate text-[11px] bg-severity_watch_bg text-severity_watch_text rounded px-1 font-medium"
            >
              {EXCEPTION_LABEL[flags[0].kind]}
              {flags.length > 1 ? ` +${flags.length - 1}` : ""}
            </span>
          )}
        </div>
      </div>
    </div>
    <span
      className="text-[11px] font-medium text-content/95 truncate"
      title={row.notes || ""}
    >
      {row.notes || ""}
    </span>
    <span className="text-right text-[12px] font-medium tabular-nums text-content">
      {customPriced ? "—" : row.qtySold.toLocaleString()}
    </span>
    <span className="text-right text-[12px] font-medium tabular-nums text-content/95">
      {row.daysActive}/90
    </span>
    <span className="text-right text-[12px] font-medium tabular-nums text-content/95">
      {customPriced ? "—" : `${row.daysAtPrice}/${row.daysActive}`}
    </span>
    <span className="text-right text-[12px] font-medium tabular-nums text-content/95">
      {row.forecastWindow}
    </span>
    <span className="text-right text-[12px] font-medium tabular-nums text-content">
      {row.adDays === 0 ? "—" : row.adDays}
    </span>
    <span className="text-right text-[12px] font-medium tabular-nums text-content">
      {formatCurrency2(row.fcstPrice)}
    </span>
    <span className="text-right text-[12px] font-medium tabular-nums text-content">
      {row.adFcst.toLocaleString()}
    </span>
    <span className="text-right text-[13px] font-bold tabular-nums text-content">
      {formatCurrency2(row.fcstTotal)}
    </span>
    <span className="text-right text-[12px] font-medium tabular-nums text-content/95">
      {((entry?.share ?? 0) * 100).toFixed(1)}%
    </span>
    <span className="text-right text-[12px] font-medium tabular-nums text-content">
      {formatCurrency2(Math.max(0, row.markdownDollars))}
    </span>
  </div>
);

export default ForecastRow;
