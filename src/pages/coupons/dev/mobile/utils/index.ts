// Utils
import { couponValueOf } from "../../../../../utils/couponValue";

// Interfaces
import type {
  CouponItem,
  TransactionListItem,
} from "../../../../../interfaces";
import type { AggRow } from "../interfaces";

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

/** A section's coupons grouped by product, each with its uses per sale, by
 *  value or count. */
export const aggregateSectionCoupons = (
  coupons: CouponItem[],
  sortMetric: "amount" | "qty",
): AggRow[] => {
  const map = new Map<string, AggRow>();
  coupons.forEach((c) => {
    // `!= null`, not truthiness, as on desktop: a product_code of 0 is a
    // real code, and a falsy check would split one UPC across two rows.
    const key =
      c.product_code != null
        ? String(Math.round(Number(c.product_code)))
        : c.product_description;
    if (!map.has(key)) {
      map.set(key, {
        product_code: key,
        product_description: c.product_description,
        count: 0,
        total: 0,
        uses: [],
      });
    }
    const agg = map.get(key)!;
    agg.count++;
    agg.total += couponValueOf(c);
    const existing = agg.uses.find((u) => u.sale_id === c.sale_id);
    if (existing) {
      existing.amount += couponValueOf(c);
    } else {
      agg.uses.push({
        sale_id: c.sale_id,
        sale_date: c.sale_date,
        cashier_name: c.cashier_name,
        terminal: c.terminal,
        storeid: c.storeid,
        amount: couponValueOf(c),
        row: c,
      });
    }
  });
  const rows = Array.from(map.values());
  return sortMetric === "qty"
    ? rows.sort((a, b) => b.count - a.count)
    : rows.sort((a, b) => b.total - a.total);
};

/** Saves an open receipt as a CSV: its lines, then its gross, coupons, tax
 *  and total, named for the cashier and date. */
export const downloadReceiptCsv = (
  txLines: TransactionListItem[],
  totals: {
    txGross: number;
    txCoupons: number;
    txTax: number;
    txTotal: number;
  },
) => {
  const { txGross, txCoupons, txTax, txTotal } = totals;
  const txMeta = txLines[0] ?? null;
  const rows = [
    ["Line #", "Description", "Qty", "Total", "Type", "Coupon Amt"],
    ...txLines.map((r) => {
      const isCpn = r.is_coupon === 1;
      const isTender = r.sale_type === "Tender";
      return [
        r.line_number ?? "",
        r.product_description ?? "",
        (r.qty ?? 0) > 0 ? r.qty : "",
        isCpn ? "" : (r.total_sales ?? 0).toFixed(2),
        isCpn ? "Coupon" : isTender ? "Tender" : "Sale",
        isCpn ? couponValueOf(r).toFixed(2) : "",
      ];
    }),
    [],
    ["", "", "", "", "Gross", txGross.toFixed(2)],
    ["", "", "", "", "Coupons", (-txCoupons).toFixed(2)],
    ["", "", "", "", "Tax", txTax.toFixed(2)],
    ["", "", "", "", "Total", txTotal.toFixed(2)],
  ];
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const cashier = txMeta?.cashier_name ?? "cashier";
  const date = txMeta?.sale_date
    ? txMeta.sale_date.split("T")[0]
    : "transaction";
  const filename = `transaction_${cashier.replace(/\s+/g, "_")}_${date}.csv`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
