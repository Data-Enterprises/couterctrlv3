import { rowsToCsv } from "../../../../../utils/csvExport";
import type { RecapItem } from "./recapTypes";

/**
 * The download: one row per item per day.
 *
 * The day and the sub dept ride on every row so the file sorts and pivots on
 * its own, without the screen's grouping. Pounds is a column only for a store
 * that sells by weight, the same rule the screen follows.
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
    "units",
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
        Math.round(i.units * 1000) / 1000,
        ...(withPounds ? [Math.round(i.pounds * 1000) / 1000] : []),
        i.net.toFixed(2),
      ]),
  );
  return rowsToCsv(headers, rows);
};
