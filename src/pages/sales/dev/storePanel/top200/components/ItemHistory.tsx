// Utils
import {
  amountOf,
  amountText,
  avgPrice,
  deltaPct,
  deltaPoints,
  grossProfit,
  weighed,
  type RankHistory,
  type TopItemCompared,
} from "../utils/topItems";
import { moneyText, pctText, pointsText } from "../utils";

interface ItemHistoryProps {
  history: RankHistory;
  /** One picked day or the week, as the headings name it. */
  periodLabel: string;
  selected: TopItemCompared;
}

/** Where it ranked in each period, and its metrics against each baseline. */
const ItemHistory = ({ history, periodLabel, selected }: ItemHistoryProps) => {
  /** The supporting metrics: every row TY, and against each baseline. */
  const metricRows = !selected
    ? []
    : [
        {
          label: "Sales",
          ty: moneyText(selected.ty.total_sales),
          lw: pctText(selected.vsLW),
          ly: pctText(selected.vsLY),
        },
        {
          label: weighed(selected.ty) ? "Pounds" : "Units",
          ty: amountText(selected.ty),
          lw: pctText(
            deltaPct(
              amountOf(selected.ty),
              selected.lw ? amountOf(selected.lw) : undefined,
            ),
          ),
          ly: pctText(
            deltaPct(
              amountOf(selected.ty),
              selected.ly ? amountOf(selected.ly) : undefined,
            ),
          ),
        },
        {
          label: weighed(selected.ty) ? "Price per lb" : "Avg price",
          ty: moneyText(avgPrice(selected.ty)),
          lw: pctText(
            deltaPct(
              avgPrice(selected.ty),
              selected.lw ? avgPrice(selected.lw) : null,
            ),
          ),
          ly: pctText(
            deltaPct(
              avgPrice(selected.ty),
              selected.ly ? avgPrice(selected.ly) : null,
            ),
          ),
        },
        {
          label: "Margin",
          ty:
            selected.ty.margin === null
              ? "—"
              : `${selected.ty.margin.toFixed(1)}%`,
          lw: pointsText(deltaPoints(selected.ty.margin, selected.lw?.margin)),
          ly: pointsText(deltaPoints(selected.ty.margin, selected.ly?.margin)),
        },
        {
          label: "Gross profit",
          ty: moneyText(grossProfit(selected.ty)),
          lw: pctText(
            deltaPct(
              grossProfit(selected.ty),
              selected.lw ? grossProfit(selected.lw) : null,
            ),
          ),
          ly: pctText(
            deltaPct(
              grossProfit(selected.ty),
              selected.ly ? grossProfit(selected.ly) : null,
            ),
          ),
        },
      ];

  return (
    <div className="px-4 py-2.5 border-b border-gray-100">
      <div className="text-[14px] font-bold text-content leading-snug">
        {history.says}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        {(
          [
            ["Last year", history.ly],
            ["Last week", history.lw],
            [periodLabel, history.ty],
          ] as const
        ).map(([label, at], i) => (
          <div
            key={label}
            className={`rounded-md px-2.5 py-2 ${i === 2 ? "border bg-row_selected border-row_selected_border" : "bg-bkg"}`}
          >
            <div className="text-[11px] text-content/95">
              {label}
            </div>
            <div className="text-[13.5px] font-semibold text-content tabular-nums">
              {at === null ? "not in top 200" : `#${at}`}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_84px_62px_62px] gap-1.5 mt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-content/95">
        <span />
        <span className="text-right">{periodLabel}</span>
        <span className="text-right">vs LW</span>
        <span className="text-right">vs LY</span>
      </div>
      {metricRows.map((m) => (
        <div
          key={m.label}
          className="grid grid-cols-[1fr_84px_62px_62px] gap-1.5 items-center py-1.5 border-t border-gray-100 text-[13px]"
        >
          <span className="text-content truncate">{m.label}</span>
          <span className="text-[13px] font-semibold text-content text-right tabular-nums">
            {m.ty}
          </span>
          <span className="text-[13px] font-semibold text-content text-right tabular-nums">
            {m.lw}
          </span>
          <span className="text-[13px] font-semibold text-content text-right tabular-nums">
            {m.ly}
          </span>
        </div>
      ))}

      {/* The gap, named. Deliveries are a different endpoint and
          this tab does not call it; saying so beats a bar that
          cannot be drawn. */}
      <p className="text-[13px] text-content/95 mt-1.5 leading-snug">
        What arrived this week is not read here &mdash; the
        department investigation reads ordering against sales.
      </p>
    </div>
  );
};

export default ItemHistory;
