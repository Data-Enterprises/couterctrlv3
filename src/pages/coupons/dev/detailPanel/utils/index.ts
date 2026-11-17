// Utils
import {
  couponValueOf,
  sumCouponAmount,
} from "../../../../../utils/couponValue";

// Interfaces
import type {
  CouponItem,
  ThresholdValue,
  TransactionListItem,
} from "../../../../../interfaces";
import type { AggRow, GroupedSection } from "../interfaces";

/** A threshold filter as its chip shows it, such as "> $5". */
export const fmtThreshold = (t: ThresholdValue | null, prefix = ""): string => {
  if (!t) return "";
  const sym = t.op === "gt" ? ">" : t.op === "lt" ? "<" : "=";
  return `${sym} ${prefix}${t.amount}`;
};

/** One grouping of the coupons into sections, by value or count, or in date
 *  order when `chronological`. */
const buildSections = (
  rows: CouponItem[],
  getKey: (r: CouponItem) => string,
  getLabel: (r: CouponItem) => string,
  sortMetric: "amount" | "qty",
  chronological = false,
): GroupedSection[] => {
  const map = new Map<string, { label: string; rows: CouponItem[] }>();
  rows.forEach((r) => {
    const k = getKey(r);
    if (!map.has(k)) map.set(k, { label: getLabel(r), rows: [] });
    map.get(k)!.rows.push(r);
  });
  const sections = Array.from(map.entries()).map(
    ([key, { label, rows: rs }]) => ({
      key,
      label,
      count: rs.length,
      total: sumCouponAmount(rs),
      rows: rs,
    }),
  );
  if (chronological) return sections.sort((a, b) => a.key.localeCompare(b.key));
  return sections.sort(
    sortMetric === "qty"
      ? (a, b) => b.count - a.count
      : (a, b) => b.total - a.total,
  );
};

/** The coupons grouped all three ways at once, so switching tabs is instant. */
export const buildAllSections = (
  visibleRows: CouponItem[],
  sortMetric: "amount" | "qty",
) => ({
  subdept: buildSections(
    visibleRows,
    (r) => r.sub_department_description,
    (r) => r.sub_department_description,
    sortMetric,
  ),
  date: buildSections(
    visibleRows,
    (r) => r.sale_date.split("T")[0],
    (r) =>
      new Date(r.sale_date.split("T")[0] + "T12:00:00").toLocaleDateString(
        "en-US",
        { weekday: "short", month: "numeric", day: "numeric" },
      ),
    sortMetric,
    true,
  ),
  cashier: buildSections(
    visibleRows,
    (r) => r.cashier_name || "unknown",
    (r) => r.cashier_name || "Unknown cashier",
    sortMetric,
  ),
});

/** The grid's rows after its applied column filters. */
export const filterGridRows = (
  gridRows: CouponItem[],
  applied: {
    product: string;
    upc: string;
    subDept: string;
    amount: ThresholdValue | null;
  },
) =>
  gridRows.filter((r) => {
    if (
      applied.product &&
      !r.product_description
        .toLowerCase()
        .includes(applied.product.toLowerCase())
    )
      return false;
    if (
      applied.upc &&
      !String(
        r.product_code != null ? Math.round(Number(r.product_code)) : "",
      ).includes(applied.upc)
    )
      return false;
    if (applied.subDept && r.sub_department_description !== applied.subDept)
      return false;
    if (applied.amount) {
      const amt = couponValueOf(r);
      if (applied.amount.op === "gt" && !(amt > applied.amount.amount))
        return false;
      if (applied.amount.op === "lt" && !(amt < applied.amount.amount))
        return false;
      if (applied.amount.op === "eq" && amt !== applied.amount.amount)
        return false;
    }
    return true;
  });

/** The grid's coupons grouped by UPC (or product), each with its uses per
 *  sale, by value or count. */
export const aggregateGridCoupons = (
  rows: CouponItem[],
  sortMetric: "amount" | "qty",
) => {
  const map = new Map<string, AggRow>();
  rows.forEach((r) => {
    const key =
      r.product_code != null
        ? String(Math.round(Number(r.product_code)))
        : r.product_description;
    if (!map.has(key)) {
      map.set(key, {
        product_code: key,
        product_description: r.product_description,
        sub_department_description: r.sub_department_description,
        count: 0,
        total: 0,
        uses: [],
      });
    }
    const agg = map.get(key)!;
    agg.count++;
    agg.total += couponValueOf(r);
    const existing = agg.uses.find((u) => u.sale_id === r.sale_id);
    if (existing) {
      existing.count++;
      existing.amount += couponValueOf(r);
    } else {
      agg.uses.push({
        sale_id: r.sale_id,
        sale_date: r.sale_date,
        cashier_name: r.cashier_name,
        storeid: r.storeid,
        store_number: r.store_number,
        terminal: r.terminal,
        count: 1,
        amount: couponValueOf(r),
        row: r,
      });
    }
  });
  const out = Array.from(map.values());
  return sortMetric === "qty"
    ? out.sort((a, b) => b.count - a.count)
    : out.sort((a, b) => b.total - a.total);
};

/** The scope's figures for the top KPI strip. */
export const scopeFigures = (visibleRows: CouponItem[]) => {
  const totalCoupons = visibleRows.length;
  const totalAmount = sumCouponAmount(visibleRows);
  return {
    totalCoupons,
    totalAmount,
    avgPerCoupon: totalCoupons > 0 ? totalAmount / totalCoupons : 0,
    uniqueProducts: new Set(visibleRows.map((c) => c.product_code)).size,
    uniqueSubDepts: new Set(
      visibleRows.map((c) => c.sub_department_description),
    ).size,
    vendorCount: visibleRows.filter((c) => c.vendor_coupon === 1).length,
  };
};

/** Saves an open receipt's lines as a CSV named for its store, date and
 *  transaction. */
export const downloadTransactionCsv = (
  txLines: TransactionListItem[],
  txMeta: TransactionListItem | null,
) => {
  const headers = [
    "Line",
    "Description",
    "Qty",
    "Sale Type",
    "Total",
    "Coupon Amount",
  ];
  const rows = txLines.map((item) => [
    item.line_number,
    `"${(item.product_description ?? "").replace(/"/g, '""')}"`,
    item.qty ?? "",
    item.sale_type ?? "",
    item.is_coupon === 1 ? "" : (item.total_sales ?? ""),
    item.is_coupon === 1 ? couponValueOf(item) : "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const txId = txMeta?.transaction_id ?? txMeta?.sale_id?.split("-")[1] ?? "tx";
  const store = txMeta?.store_name?.replace(/\s+/g, "_") ?? "store";
  const date = txMeta?.sale_date?.split("T")[0] ?? "";
  a.href = url;
  a.download = `transaction_${store}_${date}_${txId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
