import { getCoupons } from "../../../api/coupons";
import { withResolvedCouponAmount } from "../../../utils/couponValue";
import type { CouponItem, CouponsResponse, Store } from "../../../interfaces";
import { resolveStoreName } from "../../../utils";
import type { EventRow } from "../../../features/eventPerfSlice";
import type { ReceiptLine } from "./receiptTypes";

interface Scope {
  url: string;
  token: string;
  /** The searched week, end-6..end. */
  start: string;
  end: string;
  /** The comparison window, end-20..end-7 — fourteen days. */
  baseStart: string;
  baseEnd: string;
  useGroups: number;
  searchValue: number;
  singleStore: number;
  /** See the store-name rule — resolved at the row boundary, never read off
   *  the payload. */
  assignedStores: Store[];
  groupStores: Store[];
}

/** How a coupon line is labelled. `coupon_type` is the specific one when the
 *  payload carries it; the vendor/store split is the coarse one every row has. */
const lensOf = (c: CouponItem) => {
  // The payload sends these lowercase — "vendor", "store" — and they are shown
  // as a card title, so they are capitalised here rather than at every point
  // of display.
  const named = (c.coupon_type ?? "").trim();
  if (named) return named.charAt(0).toUpperCase() + named.slice(1);
  if (c.vendor_coupon > 0) return "Vendor";
  if (c.store_coupon > 0) return "Store";
  return "Other";
};

/**
 * Coupon lines as event rows.
 *
 * `withResolvedCouponAmount` is not optional here. `coupon_amount` can be null
 * with the real figure in `store_coupon`/`vendor_coupon`, and those are
 * TRANSACTION-level values repeated on every line of the sale — summing them
 * per row reported $38.97 of coupon against a $29.97 basket. Resolving first
 * puts the figure on the sale's first line and zero on the rest, so the shell
 * can add up a column without knowing any of this.
 */
const toRows = (items: CouponItem[], scope: Scope): EventRow[] =>
  withResolvedCouponAmount(items).map((c) => ({
    lens: lensOf(c),
    storeid: c.storeid,
    store_number: c.store_number,
    store_name: resolveStoreName(
      scope.assignedStores,
      scope.groupStores,
      c.storeid,
      c.store_name,
    ),
    cashier_number: c.cashier_number,
    cashier_name: c.cashier_name,
    terminal: c.terminal ?? "",
    sale_id: String(c.sale_id),
    day: c.sale_date.split("T")[0],
    amount: c.coupon_amount,
    count: 1,
  }));

const load = async (
  { url, token, useGroups, searchValue, singleStore }: Scope,
  start: string,
  end: string,
): Promise<CouponItem[]> => {
  const resp = await getCoupons(
    url,
    token,
    start,
    end,
    useGroups,
    singleStore,
    searchValue,
  );
  const j = resp.data as CouponsResponse;
  if (j.error !== 0) throw new Error(j.msg ?? "Failed to load coupons");
  // `records`, not `coupons`. Reading the wrong key made every response look
  // empty, so the page reported "nothing found" against a full payload.
  return j.records ?? [];
};

/**
 * The week, and the fourteen days before it halved into a weekly equivalent.
 *
 * Halving happens here rather than in the shell because it is a fact about
 * this page's window, not about comparisons in general — LP's baseline already
 * arrives weekly-equivalent, and dividing it too would understate every bar on
 * that page by half.
 */
export const fetchCouponEvents = async (
  scope: Scope,
  onProgress: (message: string) => void,
) => {
  onProgress("Loading coupons...");

  // The baseline failing is not fatal: a week with no comparison is still a
  // week worth reading, and it simply draws without a second bar.
  const [week, base] = await Promise.all([
    load(scope, scope.start, scope.end),
    load(scope, scope.baseStart, scope.baseEnd).catch(() => [] as CouponItem[]),
  ]);

  const rows = toRows(week, scope);
  const baseline = toRows(base, scope).map((r) => ({
    ...r,
    amount: r.amount / 2,
    count: r.count / 2,
  }));

  // Ordered by size, so the busiest coupon type is the first chip rather than
  // whichever one happened to appear first in the payload.
  const size = new Map<string, number>();
  for (const r of rows) size.set(r.lens, (size.get(r.lens) ?? 0) + r.amount);
  const lenses = [...size.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([lens]) => lens);

  // The raw lines ride along so a receipt can be resolved from memory. LP has
  // to fetch one; this page already holds every line of every sale.
  return { rows, baseline, lenses, items: week };
};

/** The coupon lines on one sale. Already in memory — no fetch. */
export const couponReceipt = (
  items: CouponItem[],
  saleId: string,
): ReceiptLine[] =>
  withResolvedCouponAmount(
    items.filter((c) => String(c.sale_id) === saleId),
  ).map((c) => ({
    description: c.product_description,
    qty: c.qty ?? 0,
    amount: c.coupon_amount,
  }));
