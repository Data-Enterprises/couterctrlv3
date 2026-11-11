// Utils
import { TIER_LABEL } from "../../utils/forecastRanking";
import { formatCurrency2 } from "../../../../../utils";

// Interfaces
import type { ForecastOutlierRow } from "../../../../../features/dev/devForecastDevSlice";
import type { RankEntry } from "../../interfaces";
import type { ColKey, RankedRow } from "../interfaces";

/**
 * A row as exported: sorted by contribution, carrying its rank, band and share.
 */
export const withRank = (
  rows: ForecastOutlierRow[],
  ranks: Map<string, RankEntry>,
): RankedRow[] =>
  [...rows]
    .sort((a, b) => b.fcstTotal - a.fcstTotal)
    .map((row) => {
      const entry = ranks.get(row.upc);
      return {
        ...row,
        rank: entry?.rank ?? "",
        tier: entry ? TIER_LABEL[entry.tier] : "",
        sharePct: entry ? (entry.share * 100).toFixed(1) : "",
      };
    });

/** The Custom export's columns, in download order. */
export const COLS: { key: ColKey; label: string }[] = [
  { key: "rank", label: "Rank" },
  { key: "tier", label: "Band" },
  { key: "sharePct", label: "Share %" },
  { key: "upc", label: "UPC" },
  { key: "description", label: "Description" },
  { key: "notes", label: "Notes" },
  { key: "qtySold", label: "Qty sold" },
  { key: "daysActive", label: "Days active" },
  { key: "daysAtPrice", label: "Days at price" },
  { key: "forecastWindow", label: "Forecast" },
  { key: "adDays", label: "Ad days" },
  { key: "fcstPrice", label: "Price" },
  { key: "adFcst", label: "Ad fcst" },
  { key: "fcstTotal", label: "Total" },
  { key: "markdownDollars", label: "Markdown" },
];

/** The columns of the not-found UPCs file. */
export const NOT_FOUND_HEADERS = [
  { headerName: "UPC", field: "upc" },
  { headerName: "Page Name", field: "pageName" },
  { headerName: "Feature Description", field: "featureDescription" },
  { headerName: "Feature Notes", field: "featureNotes" },
];

/** How many rows the Custom preview shows. */
export const PREVIEW_ROWS = 8;

/** The export modal's checkbox, radio, section label and download button classes. */
export const CHECKBOX =
  "mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0 disabled:cursor-not-allowed";
export const CUSTOM_CHECKBOX = "accent-brand_navy h-3.5 w-3.5 rounded flex-shrink-0";
export const CUSTOM_RADIO = "accent-brand_navy h-3.5 w-3.5";
export const SECTION_LABEL =
  "text-[10px] font-semibold uppercase tracking-wide text-content mb-2";
export const DOWNLOAD_BTN =
  "flex items-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors";

/** One ranked row's text for one export column. */
export const cell = (row: RankedRow, key: ColKey) => {
  switch (key) {
    case "rank":
      return String(row.rank);
    case "tier":
      return row.tier;
    case "sharePct":
      return `${row.sharePct}%`;
    case "notes":
      return row.notes ?? "";
    case "daysActive":
      return `${row.daysActive}/90`;
    case "daysAtPrice":
      return `${row.daysAtPrice}/${row.daysActive}`;
    case "adDays":
      return row.adDays === 0 ? "—" : String(row.adDays);
    case "fcstPrice":
      return formatCurrency2(row.fcstPrice);
    case "fcstTotal":
      return formatCurrency2(row.fcstTotal);
    case "markdownDollars":
      return formatCurrency2(Math.max(0, row.markdownDollars));
    default:
      return String(row[key] ?? "");
  }
};
