// API
import { searchReceiversByItem } from "../api/receivers";

// Utils
import { normalizeProductCode } from "./productCode";
import { fetchAllPages, inBatches } from "./paging";
import { shiftIso } from "./grading";

// Interfaces
import type {
  ReceivedLine,
  ReceiverItemSearchLine,
  ReceiverItemSearchReceiver,
  ReceiverItemSearchResponse,
} from "../interfaces";

/**
 * Receivers by item: which deliveries carried a set of UPCs, flattened to one
 * line per item received. Item Actions walks it for its receiving answer;
 * Price Opt reads it for what a store actually paid.
 */

/** Where the search runs: one store, back from `end` (yyyy-mm-dd). */
export interface ReceiverSearchScope {
  url: string;
  token: string;
  storeid: number;
  end: string;
}

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
): ReceivedLine => ({
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

export const fetchReceiversByItem = async (
  scope: ReceiverSearchScope,
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
  scope: ReceiverSearchScope,
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
