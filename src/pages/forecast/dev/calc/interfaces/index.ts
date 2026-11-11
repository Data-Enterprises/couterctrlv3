// Interfaces
import type { ForecastOutlierRow } from "../../../../../features/dev/devForecastDevSlice";
import type { PriceHistory } from "../../../../../interfaces";

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

export interface Args {
  pricesWithQty: number[][];
  priceHistory: PriceHistory[];
  regularRetail: number;
  selectedRow: ForecastOutlierRow;
  overallUnits: number;
  liveAdDays: number;
  customPrices: number[];
}
