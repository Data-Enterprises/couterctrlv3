import { rowsToCsv } from "../../../../../utils/csvExport";
import { NO_VENDOR } from "./recapItems";
import type { RecapItem } from "./recapTypes";

/** The item's vendors that day, biggest first; blank where it had none. */
const vendorCell = (i: RecapItem) =>
  (i.vendors ?? [])
    .map((v) => v.vendor)
    .filter((v) => v !== NO_VENDOR)
    .join("; ");

/**
 * The download: one row per item per day.
 *
 * The day and the sub dept ride on every row so the file sorts and pivots on
 * its own, without the screen's grouping. The columns follow the item view's:
 * vendor (every vendor that sold it that day, biggest first, "; " between
 * them; blank for none), qty, pounds only for a store that sells by weight,
 * net sales.
 */
export const recapCsv = (
  days: { date: string; items: RecapItem[] }[],
  withPounds: boolean,
): string => {
  const headers = [
    "date",
    "sub_department",
    "product_code",
    "description",
    "vendor",
    "qty",
    ...(withPounds ? ["pounds"] : []),
    "net_sales",
  ];
  const rows = days.flatMap(({ date, items }) =>
    [...items]
      .sort(
        (a, b) =>
          a.subDeptName.localeCompare(b.subDeptName) || b.net - a.net,
      )
      .map((i) => [
        date,
        i.subDeptName,
        i.code,
        i.name,
        vendorCell(i),
        Math.round(i.units * 1000) / 1000,
        ...(withPounds ? [Math.round(i.pounds * 1000) / 1000] : []),
        i.net.toFixed(2),
      ]),
  );
  return rowsToCsv(headers, rows);
};
