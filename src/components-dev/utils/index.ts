// Utils
import { PRICED_UNITS_LABEL } from "../../utils/pricedUnits";

// Interfaces
import type { RowMetricKey } from "../../utils/itemMargins";

/** Served straight from `public/`, so this is a path and not a fetch. */
export const DOC = "/coming-soon.html";

/** The info button's shell classes on navy and on light backgrounds. */
export const SHELL: Record<"navy" | "light", string> = {
  navy: "w-[22px] h-[22px] rounded border border-custom-white/20 text-custom-white/95 hover:text-custom-white hover:border-custom-white/40",
  light: "w-7 h-7 rounded-full text-content/95 active:bg-bkg",
};

/** The info button's icon size on navy and on light backgrounds. */
export const GLYPH: Record<"navy" | "light", string> = {
  navy: "w-3.5 h-3.5",
  light: "w-5 h-5",
};

/** The rows of one yyyy-mm-dd day. */
export const byDate = <T extends { sale_date: string }>(src: T[], dateStr: string) =>
  src.filter((m) => m.sale_date.split("T")[0] === dateStr);

/** Each report row's label. */
export const REPORT_ROW_LABELS: Record<RowMetricKey, string> = {
  margin: "Margin",
  contribution: "Contribution",
  sales: "Sales",
  // Names both units: the row prints pounds on a scale item and a count on
  // everything else, and a bare "Qty" made the pounds look like a count.
  qty: PRICED_UNITS_LABEL,
  cogs: "COGS",
};

/**
 * The Performance left-panel column-header look — identical type scale to the
 * static headers these replaced, so making a column sortable doesn't restyle
 * the header row around it.
 */
export const PERF_SORT_HEADER =
  "text-[11.5px] font-semibold uppercase tracking-wide text-content/95 hover:text-content flex-shrink-0";

/** Copies UPCs to the clipboard, comma separated. */
export const copyToClipboard = (upcs: string[]) => navigator.clipboard.writeText(upcs.join(", "));
