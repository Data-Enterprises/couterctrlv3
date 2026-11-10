// Utils
import {
  amountText,
  avgPrice,
  grossProfit,
  weighed,
  type pointsFor,
  type RetailMix,
  type TopItemCompared,
} from "../utils/topItems";
import { dayText, moneyText } from "../utils";

// Interfaces
import type { ItemDetailResponse } from "../../../../../../api/topItems";

interface ItemCostProps {
  selected: TopItemCompared;
  points: ReturnType<typeof pointsFor>;
  mix: RetailMix | null;
  detail: ItemDetailResponse | null;
  perUnitCost: number | null;
  topPrice: number | null;
  topMargin: number | null;
}

/** Whether the cost and the retail are right: price, cost, margin, profit. */
const ItemCost = ({
  selected,
  points,
  mix,
  detail,
  perUnitCost,
  topPrice,
  topMargin,
}: ItemCostProps) => {
  /*
   * The headline price.
   *
   * One price point IS the price — read it off the row rather than dividing
   * sales by amount, which only lands on the same number when nothing moved
   * all week. With several, the blended average is the honest single figure
   * and the ladder below shows what it is blending.
   */
  const headlinePrice =
    points.length === 1
      ? points[0].price
      : selected
        ? avgPrice(selected.ty)
        : null;

  const perUnitMargin =
    headlinePrice !== null && perUnitCost !== null
      ? headlinePrice - perUnitCost
      : null;

  return (
    <div
      data-help="item-cost"
      className="px-4 py-2.5 border-b border-gray-100"
    >
      <div
        className={`text-[14px] font-bold leading-snug ${
          perUnitMargin !== null && perUnitMargin < 0
            ? "text-severity_critical_text"
            : "text-content"
        }`}
      >
        {perUnitMargin === null
          ? "Cost is not known for this item"
          : perUnitMargin < 0
            ? `Selling at a loss \u2014 ${moneyText(Math.abs(perUnitMargin))} on every ${weighed(selected.ty) ? "pound" : "unit"}`
            : `Makes ${moneyText(perUnitMargin)} a ${weighed(selected.ty) ? "pound" : "unit"}`}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-2 py-1">
        <span className="text-[12.5px] text-content truncate">
          Selling at
          {mix && mix.adPct >= 50 && (
            <span className="text-[11px] text-content/95">
              {" "}
              (on ad)
            </span>
          )}
        </span>
        <span className="text-[14px] font-semibold text-content tabular-nums flex-shrink-0">
          {moneyText(headlinePrice)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 py-1 border-b border-brand_navy/15">
        <span className="text-[12.5px] text-content truncate">
          Cost
          <span className="text-[11px] text-content/95">
            {" "}
            &middot;{" "}
            {detail?.cost_summary
              ? `last invoice ${dayText(detail.cost_summary.last_bought_on)}`
              : selected.ty.cost_coverage === null
                ? "no line carried a cost"
                : `${Math.round(selected.ty.cost_coverage)}% of lines costed`}
          </span>
        </span>
        <span className="text-[14px] font-semibold text-content tabular-nums flex-shrink-0">
          {moneyText(perUnitCost)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div
          className={`rounded-md px-2.5 py-2 ${
            selected.ty.margin === null
              ? "bg-gray-100"
              : selected.ty.margin < 0
                ? "bg-severity_critical_bg"
                : "bg-severity_healthy_bg"
          }`}
        >
          <div
            className={`text-[11.5px] font-semibold ${
              selected.ty.margin === null
                ? "text-content/95"
                : selected.ty.margin < 0
                  ? "text-severity_critical_text"
                  : "text-severity_healthy_text"
            }`}
          >
            Margin now
          </div>
          <div
            className={`text-[18px] font-bold tabular-nums leading-tight ${
              selected.ty.margin === null
                ? "text-content"
                : selected.ty.margin < 0
                  ? "text-severity_critical_text"
                  : "text-severity_healthy_text"
            }`}
          >
            {selected.ty.margin === null
              ? "\u2014"
              : `${selected.ty.margin.toFixed(1)}%`}
          </div>
          <div className="text-[11px] text-content/95">
            {perUnitMargin === null
              ? "no cost to compare"
              : `${perUnitMargin < 0 ? "loses" : "makes"} ${moneyText(Math.abs(perUnitMargin))} per ${weighed(selected.ty) ? "lb" : "unit"}`}
          </div>
        </div>

        {/* Only when it rang at more than one price. With a single
            price there is no higher one to compare against, and
            inventing a shelf price it never charged would be a
            worse answer than none. */}
        {topPrice !== null && topMargin !== null && (
          <div className="rounded-md px-2.5 py-2 bg-severity_watch_bg">
            <div className="text-[11.5px] font-semibold text-severity_watch_text truncate">
              At its top price {moneyText(topPrice)}
            </div>
            <div className="text-[18px] font-bold tabular-nums leading-tight text-severity_watch_text">
              {topMargin.toFixed(1)}%
            </div>
            <div className="text-[11px] text-content/95">
              {perUnitCost === null
                ? ""
                : `makes ${moneyText(topPrice - perUnitCost)} per ${weighed(selected.ty) ? "lb" : "unit"}`}
            </div>
          </div>
        )}
      </div>

      <div
        className={`flex items-center justify-between gap-2 mt-2 px-3 py-2 rounded-md ${
          grossProfit(selected.ty) === null
            ? "bg-gray-100"
            : (grossProfit(selected.ty) as number) < 0
              ? "bg-severity_critical_bg"
              : "bg-severity_healthy_bg"
        }`}
      >
        <span
          className={`text-[12.5px] font-semibold truncate ${
            grossProfit(selected.ty) === null
              ? "text-content"
              : (grossProfit(selected.ty) as number) < 0
                ? "text-severity_critical_text"
                : "text-severity_healthy_text"
          }`}
        >
          Gross profit
          <span className="font-normal">
            {" "}
            &middot; {amountText(selected.ty)} sold
          </span>
        </span>
        <span
          className={`text-[17px] font-bold tabular-nums flex-shrink-0 ${
            grossProfit(selected.ty) === null
              ? "text-content"
              : (grossProfit(selected.ty) as number) < 0
                ? "text-severity_critical_text"
                : "text-severity_healthy_text"
          }`}
        >
          {moneyText(grossProfit(selected.ty))}
        </span>
      </div>
      {grossProfit(selected.ty) === null && (
        <p className="text-[13px] text-content/95 mt-1 leading-snug">
          Too few lines carried a cost to work out a margin worth
          trusting, so the profit is withheld rather than guessed.
        </p>
      )}
    </div>
  );
};

export default ItemCost;
