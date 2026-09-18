import {
  getReceiversList,
  getReceiverDetails,
  searchReceiversByItem,
} from "../../api/receivers";
import { normalizeProductCode } from "../../utils/productCode";
import { fetchSubDeptRowsSafe } from "../../utils/marginRows";
import { getSubMarginsWithPricePoints } from "../../api/subMargins";
import { fetchAllPages } from "../../utils/paging";
import { LW_OFFSET, shiftIso } from "../../utils/grading";
import { getLYDate, setDates } from "../../utils/dates";
import { formatDate } from "../../utils";
import type {
  ReceiverListItem,
  ReceiverListResponse,
  ReceiverDetailsItem,
  ReceiverDetailsResponse,
  ReceiverItemSearchLine,
  ReceiverItemSearchReceiver,
  ReceiverItemSearchResponse,
  SubDeptMargin,
  SubMarginsPricePointsResp,
  SubsPricePoint,
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

/**
 * The same flattening, for a line that arrived via `receivers/item_search`.
 *
 * Separate rather than shared because the two shapes differ in exactly the
 * places that would fail silently: the header fields come off the receiver
 * instead of a sibling list item, and the return flag is `item_return` rather
 * than `return` — which would have read `undefined` and made every receipt look
 * like it had no returns on it.
 */
export const toReceiptLineFromSearch = (
  receiver: ReceiverItemSearchReceiver,
  line: ReceiverItemSearchLine,
): ReceiptLine => ({
  invoiceId: receiver.invoiceid,
  productCode: normalizeProductCode(line.product_code),
  description: line.product_description,
  date: receiver.invoice_date,
  vendorName: receiver.vendor_name,
  sellingUnits: line.qty,
  cases: line.cases,
  billedIn: line.cases > 0 ? "cases" : "units",
  caseSize: line.cases > 0 ? line.qty / line.cases : null,
  unitCost: line.ucost,
  retail: line.retail,
  free: line.free,
  returned: line.item_return,
});

/**
 * Every receiver holding one of `upcs`, across every page.
 *
 * Replaces the per-invoice walk: one request names the deliveries and carries
 * their lines, where the old path opened each invoice in the lookback to find
 * out whether the item was on it.
 *
 * `maxReceivers` bounds the number of requests, so it is applied to the page
 * count *before* paging rather than by trimming the result afterwards — a
 * result already fetched has already cost what the cap exists to avoid.
 */
/**
 * The endpoint's ceiling on `productCodes` per request.
 *
 * Item Actions routinely exceeds it. The walk is handed the uploaded codes plus
 * every product that sold in any of the three windows, so the sheet's "All
 * found" tab can surface items the file never named — on a full store that
 * union is five figures (10,831 on the first live run).
 *
 * Free when those codes were a client-side filter over invoices being opened
 * anyway. Not free as a request body, hence the batching.
 */
const MAX_PRODUCT_CODES = 2000;

const inBatches = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
};

export const fetchReceiversByItem = async (
  scope: ReportScope,
  upcs: string[],
  lookbackDays: number,
  maxReceivers: number,
): Promise<{ receivers: ReceiverItemSearchReceiver[]; skipped: number }> => {
  const batches = inBatches(upcs, MAX_PRODUCT_CODES);
  if (batches.length <= 1)
    return fetchReceiverBatch(scope, upcs, lookbackDays, maxReceivers);

  /**
   * Batches hold disjoint codes, so they return disjoint LINES:
   * `includeAllLines` is off, so a receiver only ever comes back carrying the
   * codes the batch asked about. A receiver holding items from two batches
   * appears twice with different lines on it, and flattening those lines yields
   * each one exactly once — so nothing here needs de-duplicating.
   *
   * `maxReceivers` stays per batch rather than being divided across them. The
   * batches are separate populations, and splitting one budget between them
   * would truncate a busy batch because a quiet one existed.
   */
  const results = await Promise.all(
    batches.map((batch) =>
      fetchReceiverBatch(scope, batch, lookbackDays, maxReceivers),
    ),
  );
  return {
    receivers: results.flatMap((r) => r.receivers),
    skipped: results.reduce((s, r) => s + r.skipped, 0),
  };
};

/** One request's worth of codes, paged. `fetchReceiversByItem` above is the
 *  entry point; this is what it runs per batch. */
const fetchReceiverBatch = async (
  scope: ReportScope,
  upcs: string[],
  lookbackDays: number,
  maxReceivers: number,
): Promise<{ receivers: ReceiverItemSearchReceiver[]; skipped: number }> => {
  /**
   * ISO, NOT `formatDate`.
   *
   * The older receivers endpoints take `m/d/yyyy` off a query string, so every
   * other call in this file runs its dates through `formatDate` first. This one
   * binds to a Pydantic `date`, which only parses `yyyy-mm-dd` and rejects
   * `5/26/2026` as `date_from_datetime_parsing: input is too short`.
   *
   * `scope.end` and `shiftIso` are both already ISO, so passing them straight
   * through is also the safer route: `formatDate` reads a UTC-parsed date with
   * local getters, which lands a day early west of UTC.
   */
  const start = shiftIso(scope.end, -lookbackDays);
  const end = scope.end;

  const firstResp = await searchReceiversByItem(
    scope.url,
    scope.token,
    scope.storeid,
    upcs,
    start,
    end,
    1,
  );
  const body: ReceiverItemSearchResponse = firstResp.data;
  // A non-zero error arrives as HTTP 200, so the status alone proves nothing.
  // The too-many-codes rejection lands here too, and its message names the
  // limit — worth surfacing verbatim rather than replacing.
  if (body.error !== 0)
    throw new Error(body.msg ?? "Could not search receivers");

  const pageSize = body.page_size || 1;
  const maxPages = Math.max(1, Math.ceil(maxReceivers / pageSize));

  /**
   * A dropped page here reads as "no delivery", and "never received" is the one
   * conclusion this page must not hand over wrongly. One retry, then throw —
   * an error the user can act on beats a confident absence.
   */
  const askFor = async (page: number) => {
    const r = await searchReceiversByItem(
      scope.url,
      scope.token,
      scope.storeid,
      upcs,
      start,
      end,
      page,
    );
    const b: ReceiverItemSearchResponse = r.data;
    if (b.error !== 0) throw new Error(b.msg ?? `receiver page ${page} failed`);
    return b.receivers ?? [];
  };

  const receivers = await fetchAllPages(
    { ...body, total_pages: Math.min(body.total_pages ?? 1, maxPages) },
    [...(body.receivers ?? [])],
    async (page) => {
      try {
        return await askFor(page);
      } catch {
        return await askFor(page);
      }
    },
  );

  return {
    receivers,
    skipped: Math.max(0, (body.receiver_count ?? 0) - receivers.length),
  };
};
