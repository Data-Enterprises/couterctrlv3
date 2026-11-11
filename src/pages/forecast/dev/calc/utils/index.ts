// Utils
import { calcFcstQty, estimateDaysActive, forecastUnits } from "../../../../../utils/forecastCalc";

// Interfaces
import type { Args, ScenarioRow } from "../interfaces";

/**
 * Price scenarios for one item, verbatim from legacy `ScenarioTable`'s
 * `buildRow`, so both compute identical figures.
 */

export const buildScenarioRows = ({
  pricesWithQty,
  priceHistory,
  regularRetail,
  selectedRow,
  overallUnits,
  liveAdDays,
  customPrices,
}: Args): ScenarioRow[] => {
  const buildRow = (price: number, isCustom: boolean): ScenarioRow => {
    const histEntry = priceHistory.find((ph) => parseFloat(ph.price) === price);
    const histQty = histEntry ? histEntry.qty : null;
    const daysAtPrice = histEntry
      ? histEntry.days_active
      : estimateDaysActive(priceHistory, price);

    const fcstQty = calcFcstQty(pricesWithQty, price);
    const adFcst = forecastUnits(
      price,
      overallUnits,
      fcstQty,
      selectedRow.daysActive,
      90,
      daysAtPrice,
      selectedRow.forecastWindow,
      pricesWithQty,
      liveAdDays > 0 ? liveAdDays : undefined,
    );
    const revenue = price * adFcst;
    const markdown = (regularRetail - price) * adFcst;

    return { price, histQty, daysAtPrice, adFcst, revenue, markdown, isCustom };
  };

  const historicalPrices = pricesWithQty.map((pq) => pq[0]);
  return [
    ...historicalPrices
      .filter((p) => !customPrices.some((cp) => Math.abs(cp - p) < 0.001))
      .map((p) => buildRow(p, false)),
    ...customPrices.map((p) => buildRow(p, true)),
  ].sort((a, b) => a.price - b.price);
};

/** Column widths shared by the scenario table's header and rows. */
export const COLS = "1fr 60px 44px 60px 84px 84px 56px";

/** The scenario table's header row. */
export const HEAD =
  "grid gap-1.5 px-2 py-1.5 border-b border-brand_navy/15 text-[11.5px] font-semibold uppercase tracking-wide text-content/95 flex-shrink-0";

/** The calculator modal's bordered sections, their headings and field labels. */
export const SECTION = "border border-gray-200 rounded-lg overflow-hidden";
export const SECTION_HEAD =
  "px-3 py-1.5 bg-gray-50 border-b border-line_hair text-[11px] font-semibold uppercase tracking-wide text-content/95";
export const FIELD_LABEL = "text-[11px] font-medium text-content/95 ml-0.5";
