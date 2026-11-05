import { rowsToCsv } from "../../../../../../utils/csvExport";
import { NO_VENDOR } from "../../summary/utils/recapItems";
import { DEFAULT_ITEM_SORT, sortItemRows } from "../../summary/utils/recapItemSort";
import type { RecapItemRow } from "../../summary/types/index";

/** Every vendor that sold the item, biggest first; blank where it had none. */
const vendorCell = (r: RecapItemRow) => r.vendors.filter((v) => v !== NO_VENDOR).join("; ");

/**
 * The Items Sold download (Export CSV): Summary's item grid as a file.
 *
 * One row per UPC with its totals for the period (the week, or the day
 * picked), exactly as the item view lists it before any search or filter:
 * the same columns in the same order (UPC, description, sub dept, vendor,
 * net sales, qty, and pounds only for a store that sells by weight), sorted
 * the same way, biggest sales first. So the row count is the grid's item
 * count and the columns add up to its totals row.
 *
 * Vendor names every vendor that sold the item, biggest first, "; " between
 * them, where the grid shows the lead one and "+1".
 */
export const recapCsv = (rows: RecapItemRow[], withPounds: boolean): string => {
  const headers = [
    "product_code",
    "description",
    "sub_department",
    "vendor",
    "net_sales",
    "qty",
    ...(withPounds ? ["pounds"] : []),
  ];
  const lines = sortItemRows(rows, DEFAULT_ITEM_SORT).map((r) => [
    r.code,
    r.name,
    r.subDeptName,
    vendorCell(r),
    r.net.toFixed(2),
    Math.round(r.units * 1000) / 1000,
    ...(withPounds ? [(Math.round(r.pounds * 1000) / 1000).toFixed(3)] : []),
  ]);
  return rowsToCsv(headers, lines);
};
