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
