import {
  getCashierTable,
  getCashierTransaction,
  getSaleTypes,
} from "../../../api/lossPrevention";
import { fetchAllPages } from "../../../utils/paging";
import { resolveStoreName } from "../../../utils";
import type {
  CashierTransaction,
  Store,
  SaleType,
  TransactionListItem,
} from "../../../interfaces";
import type { EventRow } from "../../../features/eventPerfSlice";
import type { ReceiptLine } from "./receiptTypes";

interface Scope {
  url: string;
  token: string;
  start: string;
  end: string;
  /** The comparison window, end-20..end-7 — fourteen days, same as Coupon
   *  Sales. */
  baseStart: string;
  baseEnd: string;
  useGroups: number;
  searchValue: number;
  singleStore: number;
  /** Store names never come off a payload — see the store-name rule. Resolved
   *  here, at the one point rows are built, so every list, card and receipt
   *  downstream inherits the name the user knows the store by. */
  assignedStores: Store[];
  groupStores: Store[];
}

/** The register, whichever way this payload spelled it. The typo is real and
 *  `terminal` is carried alongside it, so reading one field silently loses
 *  half the rows on whichever backend disagrees. */
const laneOf = (t: CashierTransaction) => t.terminal ?? t.termainal ?? "";

/**
 * Every exception in the week, as flat event rows.
 *
 * The important discovery here is that `cashiers/cashier_table` takes an ARRAY
 * of sale types and its rows carry their own `sale_type`. Asking for all of
 * them at once is one paged read rather than one read per type, and it is what
 * lets the lens chips show their counts without being tapped — and lets
 * switching lenses regroup rows already in hand instead of firing a request.
 *
 * The comparison period is read the same way rather than from `cashiers/`'s
 * `trend`. Trend arrives as one aggregate per store per type with **no dates
 * and no cashier on it**, which cost two things: a day selection could not
 * narrow it, so the baseline bar sat at the full-week figure whichever day you
 * picked; and a cashier could never have a baseline at all. Reading the prior
 * fortnight's transactions costs one more paged call and fixes both.
 */
export const fetchLpEvents = async (
  scope: Scope,
  onProgress: (message: string) => void,
) => {
  const { url, token, start, end, useGroups, searchValue, singleStore } = scope;
  const args = [start, end, useGroups, searchValue, singleStore] as const;

  onProgress("Finding exception types...");
  const pre = await getSaleTypes(url, token, ...args);
  const lenses: string[] = ((pre.data?.sale_types ?? []) as SaleType[])
    .map((s) => s.sale_type)
    // Tender is excluded on every other LP surface — it is every sale, not an
    // exception, and it would swamp the chip row and every list under it.
    .filter((t) => t && t !== "Tender");

  if (lenses.length === 0) return { rows: [], baseline: [], lenses: [] };

  onProgress("Loading exceptions...");
  const [table, base] = await Promise.all([
    fetchTransactions(scope, scope.start, scope.end, lenses),
    // A missing comparison is not fatal: a week with no baseline is still a
    // week worth reading, and it simply draws without a second bar.
    fetchTransactions(scope, scope.baseStart, scope.baseEnd, lenses).catch(
      () => [] as CashierTransaction[],
    ),
  ]);

  const toRow = (t: CashierTransaction): EventRow => ({
    lens: t.sale_type,
    storeid: t.storeid,
    store_number: t.store_number,
    store_name: resolveStoreName(
      scope.assignedStores,
      scope.groupStores,
      t.storeid,
      t.store_name,
    ),
    cashier_number: t.cashier_number,
    cashier_name: t.cashier_name,
    terminal: laneOf(t),
    sale_id: t.sale_id,
    day: t.sale_date.split("T")[0],
    amount: t.total_sales ?? 0,
    count: 1,
  });

  const rows = table.map(toRow);

  // Halved, because the window is a fortnight and everything it is compared
  // against is a week. Done per row rather than on the total so that narrowing
  // to one weekday still lands on an average: two halved Saturdays are the
  // average Saturday.
  const baseline = base.map(toRow).map((r) => ({
    ...r,
    amount: r.amount / 2,
    count: r.count / 2,
  }));

  // Only the types that actually happened. A chip reading 0 is a chip that
  // wastes a tap.
  const present = new Set(rows.map((r) => r.lens));
  return { rows, baseline, lenses: lenses.filter((l) => present.has(l)) };
};

const fetchTransactions = async (
  { url, token, useGroups, searchValue, singleStore }: Scope,
  start: string,
  end: string,
  lenses: string[],
): Promise<CashierTransaction[]> => {
  const call = (page: number) =>
    getCashierTable(
      url,
      token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
      lenses,
      page,
    );

  const first = await call(1);
  const body = first.data;
  if (body.error !== 0)
    throw new Error(body.msg ?? "Failed to load exceptions");

  return fetchAllPages(body, body.transactions ?? [], async (page) => {
    try {
      const resp = await call(page);
      return resp.data.error === 0 ? (resp.data.transactions ?? []) : [];
    } catch {
      // One page failing should not lose the pages that arrived.
      return [];
    }
  });
};

/** The lines on one receipt. LP does not hold these — the transaction rows are
 *  one per sale — so opening a receipt is a fetch. */
export const fetchLpReceipt = async (
  scope: Pick<Scope, "url" | "token">,
  saleId: string,
  day: string,
  storeid: number,
): Promise<ReceiptLine[]> => {
  const resp = await getCashierTransaction(
    scope.url,
    scope.token,
    day,
    saleId,
    storeid,
  );
  const j = resp.data;
  if (j.error !== 0) return [];

  return ((j.transaction ?? []) as TransactionListItem[]).map((l) => ({
    description: l.product_description,
    qty: l.qty ?? 0,
    amount: l.total_sales ?? 0,
    // "Tender" is the same value LP filters out of its exception types — it is
    // how the sale was paid for, not something that was bought.
    kind: l.sale_type === "Tender" ? ("tender" as const) : ("item" as const),
  }));
};
