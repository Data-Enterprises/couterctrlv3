// Utils
import { couponValueOf } from "../../utils";

// Interfaces
import type { CouponBreakdown } from "../../../../../features/dev/devCouponSalesSlice";
import type { TransactionListItem } from "../../../../../interfaces";

export const TABS: { key: CouponBreakdown; label: string }[] = [
  { key: "subdept", label: "Sub Dept" },
  { key: "cashier", label: "Cashier" },
  { key: "item", label: "Items" },
];

export const SECTION_COL_LABEL: Record<CouponBreakdown, string> = {
  subdept: "Sub Dept",
  cashier: "Cashier",
  item: "Item",
};

/** A receipt's totals: gross, coupons, tax, net and total. Sale lines and
 *  coupon lines are split so the footer can show each. */
export const receiptTotals = (txLines: TransactionListItem[]) => {
  const txSaleLines = txLines.filter(
    (r) => r.sale_type === "Sale" && r.is_coupon !== 1,
  );
  const txGross = txSaleLines.reduce((acc, r) => acc + (r.total_sales ?? 0), 0);
  const txCoupons = txLines
    .filter((r) => r.is_coupon === 1)
    .reduce((acc, r) => acc + couponValueOf(r), 0);
  const txTax = txSaleLines.reduce(
    (acc, r) => acc + (r.total_rounded_tax ?? 0),
    0,
  );
  const txNet = txGross - txCoupons;
  const txTotal = txNet + txTax;
  return { txGross, txCoupons, txTax, txNet, txTotal };
};

// sale_start_time is bare digits and can come back five long (84105 =
// 08:41:05), which dev Coupons' six-digit regex misses — it then renders the
// raw number. Pad to an even length first so it always reads as a clock.
export const fmtTime = (t?: string) => {
  if (!t) return "";
  const digits = t.replace(/\D/g, "");
  if (digits.length < 3) return "";
  const padded = digits.length % 2 === 1 ? `0${digits}` : digits;
  return padded.replace(/(\d{2})(\d{2})(\d{2})?/, "$1:$2");
};

/** One receipt as a CSV, and the file name it downloads under. */
export const transactionCsv = (txLines: TransactionListItem[]) => {
  const txMeta = txLines[0] ?? null;
    const headers = ["Line", "Description", "Qty", "Sale Type", "Total", "Coupon Amount"];
    const rows = txLines.map((item) => [
      item.line_number,
      `"${(item.product_description ?? "").replace(/"/g, '""')}"`,
      item.qty ?? "",
      item.sale_type ?? "",
      item.is_coupon === 1 ? "" : (item.total_sales ?? ""),
      item.is_coupon === 1 ? couponValueOf(item) : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const txId = txMeta?.transaction_id ?? txMeta?.sale_id?.split("-")[1] ?? "tx";
    const store = txMeta?.store_name?.replace(/\s+/g, "_") ?? "store";
    const date = txMeta?.sale_date?.split("T")[0] ?? "";
  return { csv, filename: `transaction_${store}_${date}_${txId}.csv` };
};

export const pctVs = (now: number, base: number | undefined) =>
  base === undefined || base === 0 ? null : ((now - base) / base) * 100;
