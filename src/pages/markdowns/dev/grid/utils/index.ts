// Utils
import { formatCurrency2 } from "../../../../../utils";

// Interfaces
import type { MarkdownItem, MarkdownSortKey } from "../../../../../interfaces/markdowns";
import type { MarkdownTotals } from "../interfaces";

/** The pager's page sizes, as Orders offers them. */
export const PAGE_SIZES = [100, 250, 500, 1000];

/** Rows a page shows until someone picks another size. */
export const DEFAULT_PAGE_SIZE = 500;

/** How much of the item a line marked down: its weight for a scaled item,
 *  otherwise its quantity. The prices and markdown are per unit. */
export const unitsOf = (r: MarkdownItem) =>
  r.scalable === 1 && r.weight ? r.weight : (r.qty ?? 0);

/** The strip's and totals row's figures for the rows the filters keep. Avg
 *  MD % is total markdown over total original price, so a big line counts
 *  for more. */
export const markdownTotals = (rows: MarkdownItem[]): MarkdownTotals => {
  const items = new Set<string>();
  let dollars = 0;
  let original = 0;
  let pctBase = 0;
  let waste = 0;
  let qty = 0;
  let weight = 0;
  let retail = 0;
  for (const r of rows) {
    qty += r.qty ?? 0;
    weight += r.weight ?? 0;
    retail += r.retail ?? 0;
    items.add(r.product_code);
    const md = (r.markdown ?? 0) * unitsOf(r);
    dollars += md;
    if (r.type === "Waste") waste += md;
    // Only lines with both prices count toward the average.
    if (r.markdown !== null && r.original_price !== null) {
      pctBase += md;
      original += r.original_price * unitsOf(r);
    }
  }
  return {
    lines: rows.length,
    items: items.size,
    dollars,
    avgPct: original > 0 ? (pctBase / original) * 100 : null,
    waste,
    qty,
    weight,
    retail,
  };
};

/** Avg MD % as the strip and the totals row write it. */
export const fmtAvgPct = (pct: number | null) =>
  pct === null ? "—" : `${pct.toFixed(1)}%`;

/** The totals row, by grid column; a column not named is left blank.
 *  Markdown is per unit in its rows, so its total is the markdown dollars. */
export const totalsRow = (t: MarkdownTotals): Partial<Record<MarkdownSortKey, string>> => ({
  description: "Totals",
  markdown: formatCurrency2(t.dollars),
  markdown_percent: fmtAvgPct(t.avgPct),
  qty: t.qty.toLocaleString(),
  weight: t.weight.toFixed(2),
  retail: formatCurrency2(t.retail),
});
