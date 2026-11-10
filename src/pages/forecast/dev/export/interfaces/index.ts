// Interfaces
import type { ForecastOutlierRow } from "../../../../../features/dev/devForecastSlice";

/** A row plus its ranking, flattened so `exportData` can read them as fields. */
export type RankedRow = ForecastOutlierRow & {
  rank: number | "";
  tier: string;
  sharePct: string;
};

export type ModalMode = "presets" | "custom";

export type PresetId = "selected" | "all" | "notFound";

export type ColKey =
  | "rank"
  | "tier"
  | "sharePct"
  | "upc"
  | "description"
  | "notes"
  | "qtySold"
  | "daysActive"
  | "daysAtPrice"
  | "forecastWindow"
  | "adDays"
  | "fcstPrice"
  | "adFcst"
  | "fcstTotal"
  | "markdownDollars";
