import { getSubMarginsWithPricePoints } from "../../../../api/subMargins";
import { getAllOrders } from "../../../../api/orders";
import { searchReceiversByItem } from "../../../../api/receivers";
import { fetchAllPages } from "../../../../utils/paging";
import { shiftIso } from "../../../../utils/grading";
import { scopeToStoreNumber, scopeRowsToStore } from "../../../../utils/storeIdentity";
import type {
  AllOrder,
  AllOrderResp,
  ReceiverItemSearchReceiver,
  ReceiverItemSearchResponse,
  SubDeptMargin,
  SubMarginsPricePointsResp,
  SubsPricePoint,
} from "../../../../interfaces";

/**
 * Fetching for the sub-department investigation, in three waves.
 *
 * The three questions cost very different amounts and only one of them is
 * needed to put something on screen, so they are three functions rather than
 * one. Sales alone answers "which items moved", which is most of the value;
 * orders and receipts sharpen each item's cause behind it. A caller that
 * awaited all three before rendering would spend the whole budget making
 * somebody watch a spinner for the part they already had.
 *
 *   Sales     six calls, two stores x three periods, each paged.
 *   Orders    ONE call — `orders/all_orders` takes a storeids array, so both
 *             stores arrive together and the department is filtered here.
 *   Receipts  two calls, one per store, each walking its pages.
 *
 * Every endpoint here is a POST whose dates are ISO `yyyy-mm-dd`, which is
 * what the Sales page already holds. The house convention applies throughout:
 * an unexpected failure is an HTTP 200 carrying `error: 1`, so the status line
 * alone proves nothing.
 */

const USE_GROUPS = 0;
const SINGLE_STORE = 1;

/**
 * How far back orders and receipts are read.
 *
 * Deliberately NOT the sales week. These are different questions: a department
 * can be down this week because a delivery failed a fortnight ago, and reading
 * deliveries over the same seven days would answer "was it received in the
 * week you happened to pick" — true, useless, and easy to act on wrongly.
 *
 * Fourteen days covers the order-to-shelf cycle twice over without reaching so
 * far back that a receipt stops being evidence about this week.
 */
export const SUPPLY_LOOKBACK_DAYS = 14;

export interface Window {
  start: string;
  end: string;
}

export interface Store {
  storeid: number;
  /** Co-located stores share a `storeid`, so every response has to be narrowed
   *  by NUMBER as well or two locations come back merged. */
  storeNumber: string;
  name: string;
}

/**
 * What identifies a fetch — and nothing else.
 *
 * The page's Sales/Quantity metric used to sit here. Nothing in this file
 * ever read it: it is applied in `buildFacts`, over rows that are the same
 * either way. But it made the scope a different object, so flipping the
 * toggle threw away three waves of data and asked for all nine requests
 * again to arrive at arithmetic that could have been redone in place.
 */
export interface Scope {
  url: string;
  token: string;
  mine: Store;
  theirs: Store;
  subDept: number;
  tw: Window;
  lw: Window;
  ly: Window;
}

/** The supply window, derived from the sales week's end. */
export const supplyWindow = (tw: Window): Window => ({
  start: shiftIso(tw.end, -SUPPLY_LOOKBACK_DAYS),
  end: tw.end,
});

/* ------------------------------------------------------------------ */
/* Wave 1 — sales                                                      */
/* ------------------------------------------------------------------ */

export interface StorePeriodRows {
  rows: SubDeptMargin[];
  pricePoints: SubsPricePoint[];
}

/**
 * One store, one period, every page.
 *
 * `subs` pages; `price_points` does NOT — the endpoint repeats the whole
 * price-point array on every page, so only page 1 asks for it and the API
 * wrapper derives the flag from the page number. Asking again on page 2 would
 * re-run the aggregate server-side and ship an identical copy.
 *
 * A page that fails THROWS rather than resolving empty. Rows come back ordered
 * by `sale_date`, so a swallowed page silently removes the END of the window:
 * the totals stay plausible and are wrong, which is worse than refusing.
 */
const fetchPeriod = async (
  scope: Scope,
  store: Store,
  window: Window,
): Promise<StorePeriodRows> => {
  const ask = (page: number) =>
    getSubMarginsWithPricePoints(
      scope.url,
      scope.token,
      scope.subDept,
      window.start,
      window.end,
      USE_GROUPS,
      store.storeid,
      SINGLE_STORE,
      page,
    );

  const body: SubMarginsPricePointsResp = (await ask(1)).data;
  // `error: 1` is also how "no records" arrives, which is a real answer for a
  // store that sold nothing in that department, not a failure.
  if (body.error !== 0) return { rows: [], pricePoints: [] };

  const rows = await fetchAllPages(body, [...(body.subs ?? [])], async (page) => {
    const b: SubMarginsPricePointsResp = (await ask(page)).data;
    if (b.error !== 0) throw new Error(b.msg ?? `page ${page} failed`);
    return b.subs ?? [];
  });

  return {
    rows: scopeToStoreNumber(rows, store.storeNumber),
    pricePoints: scopeToStoreNumber(body.price_points ?? [], store.storeNumber),
  };
};

export interface SalesWave {
  mineTw: SubDeptMargin[];
  mineLw: SubDeptMargin[];
  mineLy: SubDeptMargin[];
  theirsTw: SubDeptMargin[];
  theirsLw: SubDeptMargin[];
  theirsLy: SubDeptMargin[];
  /** This week's ladders only. Last week's and last year's prices are a
   *  different question and nothing on the screen asks it. */
  minePoints: SubsPricePoint[];
  theirsPoints: SubsPricePoint[];
}

export const fetchSales = async (scope: Scope): Promise<SalesWave> => {
  const [mTw, mLw, mLy, tTw, tLw, tLy] = await Promise.all([
    fetchPeriod(scope, scope.mine, scope.tw),
    fetchPeriod(scope, scope.mine, scope.lw),
    fetchPeriod(scope, scope.mine, scope.ly),
    fetchPeriod(scope, scope.theirs, scope.tw),
    fetchPeriod(scope, scope.theirs, scope.lw),
    fetchPeriod(scope, scope.theirs, scope.ly),
  ]);

  return {
    mineTw: mTw.rows,
    mineLw: mLw.rows,
    mineLy: mLy.rows,
    theirsTw: tTw.rows,
    theirsLw: tLw.rows,
    theirsLy: tLy.rows,
    minePoints: mTw.pricePoints,
    theirsPoints: tTw.pricePoints,
  };
};

/* ------------------------------------------------------------------ */
/* Wave 2 — orders                                                     */
/* ------------------------------------------------------------------ */

export interface OrdersWave {
  mine: AllOrder[];
  theirs: AllOrder[];
}

/**
 * Both stores' order lines for the department, in one call.
 *
 * `orders/all_orders` takes a `storeids` ARRAY, so asking twice would be two
 * round trips for one answer. It carries no department filter, so the lines
 * are narrowed here — they already hold `sub_department`, which is why this
 * is a filter rather than a second endpoint.
 *
 * Resolves empty on failure rather than throwing: without orders every item
 * simply loses the never-ordered/not-received distinction and falls back to
 * the causes sales alone can support. That is a thinner answer, not a wrong
 * one, and it should not take the screen down.
 */
export const fetchOrders = async (scope: Scope): Promise<OrdersWave> => {
  const supply = supplyWindow(scope.tw);
  const ids = [...new Set([scope.mine.storeid, scope.theirs.storeid])];

  try {
    const resp = await getAllOrders(
      scope.url,
      scope.token,
      supply.start,
      supply.end,
      ids,
    );
    const j: AllOrderResp = resp.data;
    if (j.error !== 0) return { mine: [], theirs: [] };

    const inDept = (j.orders ?? []).filter(
      (o) => o.sub_department === scope.subDept,
    );
    // `AllOrder` spells it `storenumber`, with no underscore.
    const forStore = (s: Store) =>
      scopeRowsToStore(
        inDept.filter((o) => o.storeid === s.storeid),
        s.storeNumber,
        (o) => o.storenumber,
      );

    return { mine: forStore(scope.mine), theirs: forStore(scope.theirs) };
  } catch {
    return { mine: [], theirs: [] };
  }
};

/* ------------------------------------------------------------------ */
/* Wave 3 — receipts                                                   */
/* ------------------------------------------------------------------ */

export interface ReceiptsWave {
  mine: ReceiverItemSearchReceiver[];
  theirs: ReceiverItemSearchReceiver[];
}

/**
 * Every receiver carrying any of these product codes, for one store.
 *
 * Paged by RECEIVER, not by line: a caller that reads page 1 alone drops whole
 * deliveries rather than trailing lines, so an item that WAS received reads as
 * never received — the diagnosis goes wrong in the one direction that matters
 * most. Every page is walked.
 *
 * `includeAllLines` stays off. The question is about this department's items,
 * and the rest would be several hundred invoices' worth of lines nothing reads.
 */
const fetchStoreReceipts = async (
  scope: Scope,
  store: Store,
  codes: string[],
): Promise<ReceiverItemSearchReceiver[]> => {
  if (!codes.length) return [];
  const supply = supplyWindow(scope.tw);

  const ask = (page: number) =>
    searchReceiversByItem(
      scope.url,
      scope.token,
      store.storeid,
      codes,
      supply.start,
      supply.end,
      page,
    );

  try {
    const body: ReceiverItemSearchResponse = (await ask(1)).data;
    if (body.error !== 0) return [];

    const all = await fetchAllPages(
      body,
      [...(body.receivers ?? [])],
      async (page) => {
        const b: ReceiverItemSearchResponse = (await ask(page)).data;
        // A lost page here means a delivery that happened reads as one that
        // did not, so it is thrown rather than absorbed.
        if (b.error !== 0) throw new Error(b.msg ?? `page ${page} failed`);
        return b.receivers ?? [];
      },
    );
    return scopeToStoreNumber(all, store.storeNumber);
  } catch {
    return [];
  }
};

export const fetchReceipts = async (
  scope: Scope,
  codes: string[],
): Promise<ReceiptsWave> => {
  const [mine, theirs] = await Promise.all([
    fetchStoreReceipts(scope, scope.mine, codes),
    fetchStoreReceipts(scope, scope.theirs, codes),
  ]);
  return { mine, theirs };
};

/**
 * Every product code either store sold, which is what the receipt search is
 * asked for. An item neither store rang cannot be part of the gap.
 *
 * Coerced and sifted, because the field is typed `string` and the payload
 * does not always agree: a sub-department line with no item behind it comes
 * back carrying a numeric `0`. `item_search` validates its body, so one of
 * those rejects the whole request — 422, no receipts at all, and every item
 * in the department stuck on "still reading deliveries". A code of 0 could
 * never match a receiver line anyway, so it is dropped rather than quoted.
 */
export const codesIn = (sales: SalesWave): string[] =>
  [
    ...new Set(
      [
        sales.mineTw, sales.mineLw, sales.mineLy,
        sales.theirsTw, sales.theirsLw, sales.theirsLy,
      ]
        .flat()
        .map((r) => String(r.product_code ?? "").trim()),
    ),
  ].filter((c) => c !== "" && Number(c) !== 0);
