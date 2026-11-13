// Interfaces
import type { GroupTab } from "../../interfaces";
import type { CouponItem } from "../../../../../interfaces";

/** A searched m/d/yyyy date as a short label, e.g. Nov 9. */
export const fmtSearchDate = (mdy: string) => {
  const [m, d, y] = mdy.split("/");
  return new Date(
    `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00`,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/** The overview's group-by tabs. */
export const TABS: { key: GroupTab; label: string }[] = [
  { key: "subdept", label: "Sub dept" },
  { key: "date", label: "Date" },
  { key: "cashier", label: "Cashier" },
];

/** A coupon line's sale id: store-sale-terminal-month-day-year. */
export const buildSaleId = (row: CouponItem) => {
  const [y, m, d] = row.sale_date.split("T")[0].split("-");
  return `${row.storeid}-${row.sale_id}-${row.terminal}-${+m}-${+d}-${y}`;
};
