import type { CouponItem, Store } from "../../../interfaces";
import { formatDateSimple } from "../../../utils";
import type { CouponTier, CouponBreakdown } from "../../../features/couponSalesSlice";
import { applyStoreNumberToName, numbersByStoreId } from "../../../utils/storeIdentity";

/**
 * Coupon Sales grades on the average dollar value of a single coupon, against
 * a flat dollar threshold — not a percentage move versus last week or last
 * year. There is no baseline in play at all: the question is "are the coupons
 * coming off this register unusually large right now", over whatever range was
 * searched. That makes it an outlier check rather than a trend check, which is
 * also why it needs only two tiers.
 *
 * Average is per coupon LINE (sum of coupon_amount / number of coupon rows),
 * so the threshold reads literally: at $3, a store is flagged when its typical
 * single coupon is worth more than three dollars.
 */
export const avgCouponAmount = (amount: number, lines: number): number =>
  lines > 0 ? amount / lines : 0;

// Coupon value + null-fallback handling lives in utils/couponValue — the
// Coupons page needs the identical rule, and the two must not drift.
// Re-exported so this module stays the single import for grading callers.
import {
  couponValueOf,
  usesFallbackValue,
  sumCouponAmount,
} from "../../../utils/couponValue";
export { couponValueOf, usesFallbackValue, sumCouponAmount };

export const couponTier = (avg: number, threshold: number): CouponTier =>
  avg > threshold ? "critical" : "ok";

export const TIER_RANK: Record<CouponTier, number> = { critical: 0, ok: 1 };

export const couponDotClass: Record<CouponTier, string> = {
  critical: "bg-red-500",
  ok: "bg-emerald-500",
};

/** Solid header tint for the detail panel, mirroring severityHeaderBgClass —
 *  LP and Sales both announce the selected row's grade in the panel header
 *  rather than leaving it flat navy. */
export const couponHeaderBgClass: Record<CouponTier, string> = {
  critical: "bg-red-600",
  ok: "bg-emerald-600",
};

export const couponPillClass: Record<CouponTier, string> = {
  critical: "bg-severity_critical_bg text-severity_critical_text",
  ok: "bg-severity_healthy_bg text-severity_healthy_text",
};

/** One graded row, whatever it's grouped by. Stores, sub departments, dates
 *  and cashiers all reduce to this so the list rendering is shared. */
export type CouponRow = {
  /** Stable identity for selection and React keys. */
  key: string;
  label: string;
  /** Present on store rows only — needed to scope co-located locations. */
  storeid?: number;
  store_number?: string;
  amount: number;
  qty: number;
  /** Coupon line count. The denominator behind avgAmount. */
  lines: number;
  /** Distinct sale_id — shown, never used as the average's basis. */
  transactions: number;
  avgAmount: number;
  tier: CouponTier;
};

export type CouponTotals = {
  amount: number;
  qty: number;
  lines: number;
  transactions: number;
  avgAmount: number;
};

export const emptyTotals: CouponTotals = {
  amount: 0,
  qty: 0,
  lines: 0,
  transactions: 0,
  avgAmount: 0,
};

export const totalsFor = (rows: CouponItem[]): CouponTotals => {
  // sumCouponAmount handles the transaction-level coupon fallback.
  const amount = sumCouponAmount(rows);
  const qty = rows.reduce((acc, r) => acc + r.qty, 0);
  const transactions = new Set(rows.map((r) => r.sale_id)).size;
  return {
    amount,
    qty,
    lines: rows.length,
    transactions,
    avgAmount: avgCouponAmount(amount, rows.length),
  };
};

/** Worst first: critical above ok, then by how far over the line they sit.
 *  The list is a work queue, so the row needing attention is always on top. */
export const sortCouponRows = (rows: CouponRow[]): CouponRow[] =>
  [...rows].sort(
    (a, b) =>
      TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.avgAmount - a.avgAmount,
  );

/** Generic group-and-grade. Every breakdown routes through this so a change to
 *  the grading rule lands everywhere at once. */
const buildRows = (
  coupons: CouponItem[],
  threshold: number,
  keyOf: (c: CouponItem) => string,
  labelOf: (c: CouponItem) => string,
  decorate?: (c: CouponItem) => Partial<CouponRow>,
): CouponRow[] => {
  const groups = new Map<string, { label: string; rows: CouponItem[]; sample: CouponItem }>();
  for (const c of coupons) {
    const key = keyOf(c);
    const existing = groups.get(key);
    if (existing) existing.rows.push(c);
    else groups.set(key, { label: labelOf(c), rows: [c], sample: c });
  }

  return sortCouponRows(
    [...groups.entries()].map(([key, { label, rows, sample }]) => {
      const t = totalsFor(rows);
      return {
        key,
        label,
        amount: t.amount,
        qty: t.qty,
        lines: t.lines,
        transactions: t.transactions,
        avgAmount: t.avgAmount,
        tier: couponTier(t.avgAmount, threshold),
        ...(decorate ? decorate(sample) : {}),
      };
    }),
  );
};

/** Keyed on storeid + store_number: a few storeids cover two physical
 *  locations, and merging them would average two different operations
 *  together. See utils/storeIdentity. */
export const storeKeyOf = (c: CouponItem): string =>
  `${c.storeid}__${c.store_number}`;

export const buildStoreRows = (
  coupons: CouponItem[],
  threshold: number,
  assignedStores: Store[] = [],
  // Group searches can return stores the user isn't individually assigned to,
  // so the name has to fall through to the group list before the API row —
  // the same chain CouponListPanel walks.
  groupStores: Store[] = [],
): CouponRow[] => {
  const numbersById = numbersByStoreId(
    coupons,
    (c) => c.storeid,
    (c) => c.store_number,
  );
  return buildRows(
    coupons,
    threshold,
    storeKeyOf,
    (c) =>
      // assignedStores is the source of truth for names, and it resolves by
      // storeid — so co-located locations come back identical and the embedded
      // number has to be rewritten to match the row.
      applyStoreNumberToName(
        assignedStores.find((s) => s.storeid === c.storeid)?.store_name ??
          groupStores.find((s) => s.storeid === c.storeid)?.store_name ??
          c.store_name,
        c.store_number,
        numbersById[c.storeid] ?? [],
      ),
    (c) => ({ storeid: c.storeid, store_number: c.store_number }),
  );
};

// Keyed on the DESCRIPTION, not the id — that is what the Coupons page groups
// on (CouponDetailPanel allSections.subdept), and the two pages have to bucket
// identically or their sub dept counts drift apart wherever two ids share a
// description.
export const subDeptKeyOf = (c: CouponItem): string =>
  c.sub_department_description || `Sub dept ${c.sub_department}`;

export const buildSubDeptRows = (coupons: CouponItem[], threshold: number) =>
  buildRows(coupons, threshold, subDeptKeyOf, subDeptKeyOf);

export const buildDateRows = (coupons: CouponItem[], threshold: number) =>
  buildRows(
    coupons,
    threshold,
    // Key stays ISO — it's what sectionKeyOf matches on, and it sorts
    // chronologically. Only the label is localised.
    (c) => c.sale_date.split("T")[0],
    (c) => formatDateSimple(c.sale_date),
  );

// Also keyed on the name, matching Coupons. Express tills in particular share
// one name across several cashier numbers, so keying on the number would split
// one row there into several here.
export const cashierKeyOf = (c: CouponItem): string =>
  c.cashier_name || "unknown";

export const buildCashierRows = (coupons: CouponItem[], threshold: number) =>
  buildRows(coupons, threshold, cashierKeyOf, (c) =>
    c.cashier_name || "Unknown cashier",
  );

export const buildBreakdownRows = (
  coupons: CouponItem[],
  threshold: number,
  breakdown: CouponBreakdown,
): CouponRow[] => {
  if (breakdown === "date") return buildDateRows(coupons, threshold);
  if (breakdown === "cashier") return buildCashierRows(coupons, threshold);
  return buildSubDeptRows(coupons, threshold);
};

/** The section key a coupon row belongs to under a given breakdown — used to
 *  filter down to the selected sub dept / date / cashier. */
export const sectionKeyOf = (
  c: CouponItem,
  breakdown: CouponBreakdown,
): string => {
  if (breakdown === "date") return c.sale_date.split("T")[0];
  if (breakdown === "cashier") return cashierKeyOf(c);
  return subDeptKeyOf(c);
};

/** One row per transaction, for the drill-in beneath a selected section. */
export type CouponTransaction = {
  sale_id: number;
  /** MM/DD/YYYY for display. */
  sale_date: string;
  /** Untouched ISO value — the receipt fetch needs the real date, not the
   *  localised one. */
  rawSaleDate: string;
  storeid: number;
  cashier_name: string;
  cashier_number: number;
  terminal: string;
  amount: number;
  qty: number;
  lines: number;
  avgAmount: number;
  tier: CouponTier;
  items: CouponItem[];
};

export const buildTransactions = (
  coupons: CouponItem[],
  threshold: number,
): CouponTransaction[] => {
  const groups = new Map<number, CouponItem[]>();
  for (const c of coupons) {
    const existing = groups.get(c.sale_id);
    if (existing) existing.push(c);
    else groups.set(c.sale_id, [c]);
  }

  return [...groups.entries()]
    .map(([sale_id, items]) => {
      const t = totalsFor(items);
      const head = items[0];
      return {
        sale_id,
        sale_date: formatDateSimple(head.sale_date),
        rawSaleDate: head.sale_date,
        storeid: head.storeid,
        cashier_name: head.cashier_name,
        cashier_number: head.cashier_number,
        terminal: head.terminal,
        amount: t.amount,
        qty: t.qty,
        lines: t.lines,
        avgAmount: t.avgAmount,
        tier: couponTier(t.avgAmount, threshold),
        items: [...items].sort((a, b) => a.line_number - b.line_number),
      };
    })
    .sort(
      (a, b) =>
        TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.avgAmount - a.avgAmount,
    );
};
