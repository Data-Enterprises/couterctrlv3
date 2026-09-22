import { calcFcstQty, estimateDaysActive, forecastUnits } from "./utils";
import type { PriceHistory } from "../../interfaces";
import type { ForecastOutlierRow } from "../../features/forecastSlice";

/**
 * Price scenarios for one item.
 *
 * Lifted verbatim out of `ScenarioTable`'s `buildRow` so the dev modal and the
 * legacy table compute identical figures rather than keeping two copies of the
 * same chain. Not one operand changed: same `calcFcstQty`, same
 * `estimateDaysActive` fallback for a price with no history, same
 * `forecastUnits` argument order, same `(regularRetail - price) * adFcst`.
 */

export interface ScenarioRow {
  price: number;
  /** null when the price was typed rather than drawn from history. */
  histQty: number | null;
  daysAtPrice: number;
  adFcst: number;
  revenue: number;
  markdown: number;
  isCustom: boolean;
}

interface Args {
  pricesWithQty: number[][];
  priceHistory: PriceHistory[];
  regularRetail: number;
  selectedRow: ForecastOutlierRow;
  overallUnits: number;
  liveAdDays: number;
  customPrices: number[];
}

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
