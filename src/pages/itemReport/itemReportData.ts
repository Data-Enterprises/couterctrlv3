import { getReceiversList, getReceiverDetails } from "../../api/receivers";
import { fetchSubDeptRowsSafe } from "../../utils/marginRows";
import { fetchSubDepts } from "../inventory/inventoryData";
import { LW_OFFSET, LY_OFFSET, shiftIso } from "../../utils/grading";
import { formatDate } from "../../utils";
import type {
  ReceiverListItem,
  ReceiverListResponse,
  ReceiverDetailsItem,
  ReceiverDetailsResponse,
  SubDeptMargin,
} from "../../interfaces";

/**
 * Fetching for Item Report.
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
 * The same window a week and a year earlier.
 *
 * 364 days rather than 365 for the year: a whole number of weeks, so the
 * comparison lands on the same weekdays. Both baselines are carried because
 * neither is sufficient alone — last year catches a seasonal collapse that last
 * week would call normal, and last week catches a recovery that last year would
 * still condemn. Flagging an item that is already coming back is the false
 * warning this page most needs to avoid.
 */
export const lwWindow = (scope: ReportScope) => ({
  start: shiftIso(scope.start, LW_OFFSET),
  end: shiftIso(scope.end, LW_OFFSET),
});

export const lyWindow = (scope: ReportScope) => ({
  start: shiftIso(scope.start, LY_OFFSET),
  end: shiftIso(scope.end, LY_OFFSET),
});

/** The departments that sold in the window. Shared with Price Opt rather than
 *  reimplemented — same endpoint, same paging, same roll-up. */
export const fetchDepartments = fetchSubDepts;

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
export const fetchInvoiceLines = async (
  scope: ReportScope,
  invoice: ReceiverListItem,
): Promise<ReceiverDetailsItem[]> => {
  try {
    const resp = await getReceiverDetails(
      scope.url,
      scope.token,
      scope.storeid,
      invoice.invoiceid,
      formatDate(invoice.invoice_date),
    );
    const body: ReceiverDetailsResponse = resp.data;
    return body.error === 0 ? (body.records ?? []) : [];
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
  /** Priced selling units, not cases — the same unit `subs/subs` sells in, which
   *  is what makes the two sides comparable at all. */
  units: number;
  /** Unit cost on the day it landed. Two receipts at different costs is how a
   *  margin slips without anyone touching the shelf price. */
  unitCost: number;
  /** Retail the receipt expected, which is not always the retail that rang. */
  retail: number;
}

export const toReceiptLine = (
  invoice: ReceiverListItem,
  line: ReceiverDetailsItem,
): ReceiptLine => ({
  invoiceId: invoice.invoiceid,
  productCode: String(line.product_code),
  description: line.product_description,
  date: invoice.invoice_date,
  vendorName: invoice.vendor_name,
  units: line.qty,
  unitCost: line.ucost,
  retail: line.retail,
});
