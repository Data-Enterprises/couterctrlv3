// Interfaces
import type { MarkdownItem } from "../../../../../interfaces/markdowns";
import type { MarkdownTotals } from "../interfaces";

/** The pager's page sizes, as Orders offers them. */
export const PAGE_SIZES = [100, 250, 500, 1000];

/** Rows a page shows until someone picks another size. */
export const DEFAULT_PAGE_SIZE = 500;

/** How much of the item a line marked down: its weight for a scaled item,
 *  otherwise its quantity. The prices and markdown are per unit. */
export const unitsOf = (r: MarkdownItem) =>
  r.scalable === 1 && r.weight ? r.weight : (r.qty ?? 0);

/** The strip's figures for the rows the filters keep. Avg MD % is total
 *  markdown over total original price, so a big line counts for more. */
export const markdownTotals = (rows: MarkdownItem[]): MarkdownTotals => {
  const items = new Set<string>();
  const stores = new Set<string>();
  let dollars = 0;
  let retail = 0;
  let original = 0;
  let pctBase = 0;
  for (const r of rows) {
    items.add(r.product_code);
    stores.add(r.storename);
    retail += r.retail ?? 0;
    const md = (r.markdown ?? 0) * unitsOf(r);
    dollars += md;
    // Only lines with both prices count toward the average.
    if (r.markdown !== null && r.original_price !== null) {
      pctBase += md;
      original += r.original_price * unitsOf(r);
    }
  }
  return {
    items: items.size,
    dollars,
    avgPct: original > 0 ? (pctBase / original) * 100 : null,
    retail,
    stores: [...stores].sort((a, b) => a.localeCompare(b)),
  };
};
