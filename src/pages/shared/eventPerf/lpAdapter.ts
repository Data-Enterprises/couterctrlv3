import {
  getCashierDetails,
  getCashierTable,
  getCashierTransaction,
  getSaleTypes,
} from "../../../api/lossPrevention";
import { fetchAllPages } from "../../../utils/paging";
import type {
  CashierTransaction,
  CashierTrend,
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
  useGroups: number;
  searchValue: number;
  singleStore: number;
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
 * `cashiers/` is still called, but only for `trend`: the transaction rows have
 * no comparison period in them, and trend is the one place the prior weeks
 * live. Its figures are already weekly-equivalent — the desktop page compares
 * them 1:1 against the week — so nothing here rescales them.
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
  const [table, details] = await Promise.all([
    fetchTransactions(scope, lenses),
    getCashierDetails(url, token, ...args, lenses),
  ]);

  const rows: EventRow[] = table.map((t) => ({
    lens: t.sale_type,
    storeid: t.storeid,
    store_number: t.store_number,
    store_name: t.store_name,
    cashier_number: t.cashier_number,
    cashier_name: t.cashier_name,
    terminal: laneOf(t),
    sale_id: t.sale_id,
    day: t.sale_date.split("T")[0],
    amount: t.total_sales ?? 0,
    count: 1,
  }));

  // One synthetic row per store per type. It knows no cashier and no day,
  // which is exactly what the shell needs to tell it apart from a real event
  // and refuse to draw a per-person baseline it does not have.
  const baseline: EventRow[] = ((details.data?.trend ?? []) as CashierTrend[])
    .map((t) => ({
      lens: t.sale_type,
      storeid: t.storeid,
      store_number: t.store_number,
      store_name: t.store_name,
      cashier_number: null,
      cashier_name: "",
      terminal: "",
      sale_id: "",
      day: "",
      amount: t.amount ?? 0,
      count: t.transaction_count ?? 0,
    }))
    .filter((r) => r.count > 0 || r.amount > 0);

  // Only the types that actually happened. A chip reading 0 is a chip that
  // wastes a tap.
  const present = new Set(rows.map((r) => r.lens));
  return { rows, baseline, lenses: lenses.filter((l) => present.has(l)) };
};

const fetchTransactions = async (
  { url, token, start, end, useGroups, searchValue, singleStore }: Scope,
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
