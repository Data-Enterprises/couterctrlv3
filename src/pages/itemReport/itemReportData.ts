import { getReceiversList, getReceiverDetails } from "../../api/receivers";
import { normalizeProductCode } from "../../utils/productCode";
import { fetchSubDeptRowsSafe } from "../../utils/marginRows";
import { fetchSubDepts } from "../inventory/inventoryData";
import type { SubDeptSummary } from "../inventory/inventoryData";
import { LW_OFFSET, shiftIso } from "../../utils/grading";
import { getLYDate, setDates } from "../subDepts";
import { formatDate } from "../../utils";
import type {
  ReceiverListItem,
  ReceiverListResponse,
  ReceiverDetailsItem,
  ReceiverDetailsResponse,
  SubDeptMargin,
} from "../../interfaces";

/**
 * Fetching for Item Actions.
 *
 * The page takes a list of UPCs and answers three questions about each: how it
 * sold, what it cost, and when it was last received. Those come from two
 * different pipes with very different costs, and the split matters:
 *
 *   Sales — `subs/sub_sales` names the departments, then `subs/subs` returns
 *   every item row for one department. Bounded and predictable: one call per
 *   department per period, whether the upload holds five UPCs or five hundred.
 *
 *   Receiving — `receivers/` lists the lookback's invoices in one call, but
 *   `receivers/details` opens **one invoice at a time**, and an item can only
 *   be found by opening the invoice it's on. That walk is the expensive half of
 *   the page and is why it runs behind the report rather than in front of it.
 *
 * Register-level prices are deliberately absent here. They cost two calls per
 * item, so they belong to one selected item and live in the Price Opt hook the
 * detail panel borrows.
 */

const USE_GROUPS = 0;
const SINGLE_STORE = 1;

/**
 * How far back deliveries are read, independent of the sales window.
 *
 * These are two different questions and they were sharing one date range, which
 * made the receiving answer a function of the date picker rather than of the
 * item. On an eight-day search almost nothing has a delivery inside it, so
 * "never received" was really "not in the eight days you happened to pick" —
 * true, useless, and easy to act on wrongly.
 *
 * Ninety days is long enough that a slow mover on a monthly cycle still
 * resolves to a real date, and the walk stops early once every item has been
 * found, so the extra reach is usually free.
 */
export const RECEIVING_LOOKBACK_DAYS = 90;

export interface ReportScope {
  url: string;
  token: string;
  storeid: number;
  /** yyyy-mm-dd, the window the user picked. */
  start: string;
  end: string;
}

/**
 * How a delivery line was billed, in words rather than arithmetic.
 *
 * "1 case × 15" is correct but reads like a sum you have to do, and "8 cases × 1"
 * reads like a placeholder. The fix is that **a case size of one carries no
 * information** — a 24-pack billed one to a case *is* the selling unit, so
 * saying "× 1" only invites the question. Only a pack above one is worth
 * naming.
 *
 *     1 case of 15     15 selling units arrived in one case
 *     8 cases          8 arrived, one to a case
 *     by the unit      the vendor billed eaches, there is no pack
 *
 * Shared by the rail's delivery strip and the full-invoice modal so the two
 * cannot describe the same line differently.
 */
export const describeReceipt = (
  sellingUnits: number,
  cases: number,
): string => {
  if (cases <= 0) return "by the unit";
  const size = Math.round((sellingUnits / cases) * 10) / 10;
  const plural = `${cases} case${cases === 1 ? "" : "s"}`;
  return size > 1 ? `${plural} of ${size}` : plural;
};

/** Days in every window this page reads. Fixed rather than user-chosen, so the
 *  three periods are always the same length and directly comparable — the same
 *  contract the graded pages work to. */
export const WINDOW_DAYS = 7;

/** The week ending on the picked date. One date in, seven days out. */
export const weekEnding = (singleDate: string) => ({
  start: setDates(new Date(singleDate), WINDOW_DAYS - 1),
  end: setDates(new Date(singleDate)),
});

/**
 * The same week a week and a year earlier.
 *
 * Both baselines are carried because neither is sufficient alone — last year
 * catches a seasonal collapse that last week would call normal, and last week
 * catches a recovery that last year would still condemn. Flagging an item that
 * is already coming back is the false warning this page most needs to avoid.
 *
 * Last year goes through `getLYDate`, not a flat 364-day shift: it is holiday-
 * and leap-year aware, and the codebase says so at its definition. A naive shift
 * lands the wrong side of a moving holiday and silently compares a trading week
 * against a dead one.
 */
export const lwWindow = (scope: { start: string; end: string }) => ({
  start: shiftIso(scope.start, LW_OFFSET),
  end: shiftIso(scope.end, LW_OFFSET),
});

export const lyWindow = (scope: { start: string; end: string }) => ({
  start: getLYDate(scope.start),
  end: getLYDate(scope.end),
});

/** The departments that sold in a given window. Shared with Price Opt rather
 *  than reimplemented — same endpoint, same paging, same roll-up. */
export const fetchDepartments = fetchSubDepts;

/**
 * The departments to *read*, discovered over a wide window rather than the week
 * being reported.
 *
 * Discovery and reporting are different questions, and conflating them is a
 * silent data loss. `subs/subs` only returns departments that sold inside the
 * window it is handed, so discovering over the reported week drops any
 * department that happened to sell nothing in those seven days — and with it
 * every uploaded UPC that lives there, plus the receipts those items would have
 * been crossed against. Over a month-long window that was rare enough to miss;
 * over seven days it is routine, and it fails silently, as a short report rather
 * than an error.
 *
 * Two calls. The receiving lookback is a strict superset of this week and last
 * week, so it covers both; the same week last year sits outside it and needs its
 * own. The union is the department set — the three reported windows are still
 * read separately, so nothing here widens what the report actually counts.
 *
 * Last year is allowed to fail. A store with no history that far back should
 * still get a report from the recent departments rather than nothing at all.
 */
export const fetchDepartmentsWide = async (
  scope: ReportScope,
): Promise<SubDeptSummary[]> => {
  const [recent, priorYear] = await Promise.all([
    fetchSubDepts({
      ...scope,
      start: shiftIso(scope.end, -RECEIVING_LOOKBACK_DAYS),
    }),
    fetchSubDepts({ ...scope, ...lyWindow(scope) }).catch(
      () => [] as SubDeptSummary[],
    ),
  ]);

  const byId = new Map<number, SubDeptSummary>();
  for (const dept of [...recent, ...priorYear])
    if (!byId.has(dept.id)) byId.set(dept.id, dept);
  return [...byId.values()];
};

/**
 * Item rows for a set of departments over one window.
 *
 * Departments go out together; serialising would multiply latency by the
 * department count for nothing. A department that fails resolves to no rows
 * rather than taking the report down — losing one department understates a
 * slice of the list, losing the page helps nobody.
 */
export const fetchRowsForDepartments = async (
  scope: ReportScope,
  deptIds: number[],
  window: { start: string; end: string },
): Promise<SubDeptMargin[]> => {
  const results = await Promise.all(
    deptIds.map((id) =>
      fetchSubDeptRowsSafe(
        scope.url,
        scope.token,
        id,
        window.start,
        window.end,
        USE_GROUPS,
        scope.storeid,
        SINGLE_STORE,
      ),
    ),
  );
  return results.flat();
};

/* --------------------------------------------------------------- receiving */

/**
 * Every invoice in the window, newest first.
 *
 * One call, and the only cheap part of the receiving side. Note the response
 * key is `recievers` — misspelled server-side, and reading `receivers` off it
 * silently yields nothing.
 *
 * Dates go out as m/d/yyyy here, unlike the `subs` endpoints which take
 * yyyy-mm-dd. That asymmetry is the server's, not ours.
 */
export const fetchInvoices = async (
  scope: ReportScope,
  lookbackDays: number,
): Promise<ReceiverListItem[]> => {
  const resp = await getReceiversList(
    scope.url,
    scope.token,
    scope.storeid,
    formatDate(shiftIso(scope.end, -lookbackDays)),
    formatDate(scope.end),
  );
  const body: ReceiverListResponse = resp.data;
  // A non-zero error arrives as HTTP 200 with no data key, so the status alone
  // proves nothing.
  if (body.error !== 0) throw new Error(body.msg ?? "Failed to load receivers");
  return [...(body.recievers ?? [])].sort((a, b) =>
    b.invoice_date.localeCompare(a.invoice_date),
  );
};

/** One invoice's lines. Returns empty rather than throwing: a walk of hundreds
 *  of invoices must not lose the other 399 to one bad row. */
/**
 * One invoice, every line on it.
 *
 * Throws, unlike the walk's wrapper below. A user who clicked an invoice needs
 * to be told it failed; an empty order would read as "this delivery had nothing
 * on it", which is a different and wrong statement.
 *
 * Ignore the response's `totals` block entirely. It reports `cases` and `units`
 * — which mean different things depending on how the vendor billed, with nothing
 * in the response saying which — and its `ucost`/`retail` are sums of unrelated
 * per-unit prices. Sum `qty`, `ext_cost` and `ext_retail` from the lines instead.
 */
export const fetchInvoiceById = async (
  scope: ReportScope,
  invoiceId: number,
  invoiceDate: string,
): Promise<ReceiverDetailsItem[]> => {
  const resp = await getReceiverDetails(
    scope.url,
    scope.token,
    scope.storeid,
    invoiceId,
    formatDate(invoiceDate),
  );
  const body: ReceiverDetailsResponse = resp.data;
  if (body.error !== 0) throw new Error("Could not load that invoice");
  return body.records ?? [];
};

/** Same call, but a failure resolves to no lines. Right for the walk — one bad
 *  invoice must not lose the other 399 — and wrong for anything a user asked
 *  for directly. */
export const fetchInvoiceLines = async (
  scope: ReportScope,
  invoice: ReceiverListItem,
): Promise<ReceiverDetailsItem[]> => {
  try {
    return await fetchInvoiceById(
      scope,
      invoice.invoiceid,
      invoice.invoice_date,
    );
  } catch {
    return [];
  }
};

/** One receipt of one item, flattened out of the invoice it arrived on. */
export interface ReceiptLine {
  invoiceId: number;
  /** Carried because receipts are now an entry point in their own right — an
   *  item that was delivered and never scanned exists nowhere else. */
  productCode: string;
  description: string;
  date: string;
  vendorName: string;
  /**
   * Sellable units received. The API calls this `qty`, and it is the same basis
   * `subs/subs` sells in — which is the only reason received and sold can be
   * compared at all.
   *
   * Named `sellingUnits` rather than `units` on purpose: the API *also* has a
   * field called `units`, and it means something else entirely (see `billedIn`).
   * Carrying our own `units` that held their `qty` was a trap waiting for
   * whoever touched this next.
   *
   * Verified across 47 lines on four invoices: `ext_cost = ucost * qty` and
   * `ext_retail = retail * qty` are exact on every one.
   */
  sellingUnits: number;
  /** Shipping containers, `0` on a unit-received line. */
  cases: number;
  /**
   * How the vendor billed the line. The two modes are mutually exclusive — no
   * line ever carries both `units` and `cases` — and `qty` is sellable units
   * either way:
   *
   *     cases: qty = cases * caseSize,  units = 0
   *     units: qty = units,             cases = 0
   *
   * So a line whose `qty` equals its `cases` is a case size of one, not a line
   * counted in cases.
   */
  billedIn: "cases" | "units";
  /** Sellable units per shipping container, or null on a unit receipt. Derived,
   *  because the endpoint does not return it — worth asking for, since without
   *  it this can be computed but not checked. */
  caseSize: number | null;
  /** Unit cost on the day it landed. Two receipts at different costs is how a
   *  margin slips without anyone touching the shelf price. */
  unitCost: number;
  /** Retail the receipt expected, which is not always the retail that rang. */
  retail: number;
  /** Free goods and returns on the line.
   *
   *  Carried because they are the two things that can make "received" mean
   *  something other than "arrived and was paid for" — and both feed Net and
   *  Unaccounted, which the Reorder and Investigate reasoning rests on. Whether
   *  `units` already nets them is unverified against a real invoice, so they are
   *  surfaced rather than silently subtracted. */
  free: number;
  returned: number;
}

export const toReceiptLine = (
  invoice: ReceiverListItem,
  line: ReceiverDetailsItem,
): ReceiptLine => ({
  invoiceId: invoice.invoiceid,
  productCode: normalizeProductCode(line.product_code),
  description: line.product_description,
  date: invoice.invoice_date,
  vendorName: invoice.vendor_name,
  sellingUnits: line.qty,
  cases: line.cases,
  billedIn: line.cases > 0 ? "cases" : "units",
  caseSize: line.cases > 0 ? line.qty / line.cases : null,
  unitCost: line.ucost,
  retail: line.retail,
  free: line.free,
  returned: line.return,
});
