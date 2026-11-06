import {
  getReceiversList,
  getReceiverDetails,
} from "../../../api/receivers";
import { normalizeProductCode } from "../../../utils/productCode";
import { fetchSubDeptRowsSafe } from "../../../utils/marginRows";
import {
  getItemActions,
  getSubMarginsWithPricePoints,
  ITEM_ACTIONS_MAX_CODES,
  type ItemActionsResp,
} from "../../../api/subMargins";
import { fetchAllPages, inBatches } from "../../../utils/paging";
import { LW_OFFSET, shiftIso } from "../../../utils/grading";
import { getLYDate, WINDOW_DAYS, weekEnding } from "../../../utils/dates";
// Shared with every page that hands an item to this one, so both ends agree
// on how long the window is. Re-exported for this page's own files.
export { WINDOW_DAYS, weekEnding };
import { formatDate } from "../../../utils";
import type {
  ReceiverListItem,
  ReceiverListResponse,
  ReceiverDetailsItem,
  ReceiverDetailsResponse,
  SubDeptMargin,
  SubMarginsPricePointsResp,
  SubsPricePoint,
} from "../../../interfaces";
import type { ReceivedLine } from "../../../interfaces";
/** A line received on an invoice — defined in src/interfaces as ReceivedLine,
 *  because itemReportSlice holds it. */
export type ReceiptLine = ReceivedLine;

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

/**
 * The `subDeptId` that asks `subs/subs` for every department at once.
 *
 * Named because 0 is also a real department number in the response — as a
 * request argument it means "all", as a row value it means that department.
 */
export const ALL_SUB_DEPTS = 0;

/**
 * Rows falling inside a date window, bounds inclusive.
 *
 * Dates are `yyyy-mm-dd`, so a string compare is a date compare — no parsing
 * and no timezone to get wrong.
 */
export const inRange = (rows: SubDeptMargin[], start: string, end: string) =>
  rows.filter((r) => {
    const d = r.sale_date.split("T")[0];
    return d >= start && d <= end;
  });

/**
 * Every item row in a window, across every department, paginated.
 *
 * Replaces asking department by department, which required knowing the
 * departments first — and that is the only thing the two `subs/sub_sales`
 * discovery calls were ever for. Reaching back ninety days to enumerate
 * departments, in order to fan out across all of them anyway, bought nothing:
 * on the upload path the file names no departments, so the narrowing that
 * justified the discovery never applied.
 */
export const fetchAllItemRows = (
  scope: ReportScope,
  window: { start: string; end: string },
): Promise<SubDeptMargin[]> =>
  fetchSubDeptRowsSafe(
    scope.url,
    scope.token,
    ALL_SUB_DEPTS,
    window.start,
    window.end,
    USE_GROUPS,
    scope.storeid,
    SINGLE_STORE,
  );

/**
 * The same rows, plus the prices they actually rang at.
 *
 * Its own function rather than a flag on `fetchAllItemRows`, so the shared
 * `fetchSubDeptRowsSafe` — and the four other pages sitting on it — are left
 * exactly as they are.
 *
 * `subs` pages; `price_points` does NOT. The endpoint repeats the whole
 * price-point array on every page (verified: a two-page meat department
 * returned the identical 550 rows on both, while `subs` split 1000/437), so
 * only page 1 asks for it — `getSubMarginsWithPricePoints` derives the flag
 * from the page number. Pages 2..N carry rows alone and never build the
 * aggregate, which is why they come back faster than page 1.
 *
 * A page that fails to load THROWS rather than resolving empty. Rows are
 * ordered by `sale_date`, so a dropped page removes the end of the window and
 * every figure downstream stays plausible while being wrong.
 */
export const fetchItemRowsWithPricePoints = async (
  scope: ReportScope,
  window: { start: string; end: string },
): Promise<{ rows: SubDeptMargin[]; pricePoints: SubsPricePoint[] }> => {
  try {
    const firstResp = await getSubMarginsWithPricePoints(
      scope.url,
      scope.token,
      ALL_SUB_DEPTS,
      window.start,
      window.end,
      USE_GROUPS,
      scope.storeid,
      SINGLE_STORE,
    );
    const body: SubMarginsPricePointsResp = firstResp.data;
    // `error: 1` is also how "no records returned" arrives, which is a real
    // answer for a store with no sales that week, not a failure.
    if (body.error !== 0) return { rows: [], pricePoints: [] };

    /**
     * A page that fails is NOT an empty page.
     *
     * This swallowed failures per page, and `subs/subs` orders by `sale_date`
     * — so a dropped page silently removes the END of the window. A 14-day
     * span came back as 8 days, an item that sold 81 units reported 14, and
     * every figure downstream was plausible and wrong. A report that lies
     * quietly is worse than one that refuses to build, so the misses are
     * counted and thrown rather than absorbed.
     *
     * One retry first: the span is every department over a fortnight, and
     * `fetchAllPages` asks for 2..N at once, so a lost page is usually the
     * burst rather than the query.
     */
    let missed = 0;
    const askFor = async (page: number) => {
      const r = await getSubMarginsWithPricePoints(
        scope.url,
        scope.token,
        ALL_SUB_DEPTS,
        window.start,
        window.end,
        USE_GROUPS,
        scope.storeid,
        SINGLE_STORE,
        page,
      );
      const b: SubMarginsPricePointsResp = r.data;
      if (b.error !== 0) throw new Error(b.msg ?? `page ${page} failed`);
      return b.subs ?? [];
    };

    const rows = await fetchAllPages(body, [...(body.subs ?? [])], async (page) => {
      try {
        return await askFor(page);
      } catch {
        try {
          return await askFor(page);
        } catch {
          missed += 1;
          return [];
        }
      }
    });

    if (missed > 0) {
      const total = body.total_pages ?? 1;
      throw new Error(
        `Sales came back short — ${missed} of ${total} pages failed to load. ` +
          `Rows are ordered by date, so the end of the window would be missing. ` +
          `Nothing has been graded; run it again.`,
      );
    }

    return { rows, pricePoints: body.price_points ?? [] };
  } catch (e) {
    // A short read is re-thrown so the page reports it. Anything else resolves
    // empty, matching `fetchSubDeptRowsSafe`.
    if (e instanceof Error && e.message.startsWith("Sales came back short"))
      throw e;
    return { rows: [], pricePoints: [] };
  }
};

/**
 * The same rows, for a known list of codes, from `subs/item_actions`.
 *
 * The whole-store reads above fetch every item the store sold, page them at
 * four thousand, and then `buildReport` keeps only the uploaded list — so on
 * the upload path everything outside that list was fetched, paged,
 * transferred and thrown away. Measured on the busiest store over a week:
 * 11,799 rows in 781ms against 100 rows in 109ms, and the narrowed answer
 * fits in one page, so the count and the concurrent page burst stop happening
 * rather than getting cheaper.
 *
 * NOT for the grade path. Arriving from another page with a threshold instead
 * of a list, the page has no codes yet — `collectCriticalItems` works them out
 * FROM the store's rows, so that path genuinely needs the whole store and
 * keeps `fetchAllItemRows`.
 *
 * Batched at the endpoint's ceiling. Batches hold disjoint codes, so their
 * rows are disjoint too and the concatenation needs no de-duplicating. Price
 * points come back per batch and are concatenated the same way: they are keyed
 * by item, and no item appears in two batches.
 *
 * A batch that fails throws rather than resolving empty — same rule as the
 * paged read. Rows missing for part of the list would read as "these items did
 * not sell", which is a real verdict this page hands over, and a wrong one is
 * worse than a refusal.
 */
export const fetchItemRowsForCodes = async (
  scope: ReportScope,
  window: { start: string; end: string },
  codes: string[],
): Promise<{ rows: SubDeptMargin[]; pricePoints: SubsPricePoint[] }> => {
  if (codes.length === 0) return { rows: [], pricePoints: [] };

  const batches = inBatches(codes, ITEM_ACTIONS_MAX_CODES);
  const results = await Promise.all(
    batches.map(async (batch) => {
      const resp = await getItemActions(
        scope.url,
        scope.token,
        window.start,
        window.end,
        USE_GROUPS,
        scope.storeid,
        SINGLE_STORE,
        batch,
      );
      const body: ItemActionsResp = resp.data;
      if (body.error !== 0) {
        throw new Error(body.msg ?? "Sales could not be read for those items");
      }
      return body;
    }),
  );

  return {
    rows: results.flatMap((r) => r.data ?? []),
    pricePoints: results.flatMap((r) => r.price_points ?? []),
  };
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
