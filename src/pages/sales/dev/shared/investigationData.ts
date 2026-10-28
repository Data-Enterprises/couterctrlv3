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
 * can be down this week because a delivery failed a month ago, and reading
 * deliveries over the same seven days would answer "was it received in the
 * week you happened to pick" — true, useless, and easy to act on wrongly.
 *
 * Six weeks, because the window decides what "never ordered" means and a
 * fortnight was deciding it wrongly. Fast-moving grocery turns inside two
 * weeks, but a slow category is ordered monthly or less — and on those the
 * old window called an item never ordered when the order sat three weeks
 * back, which is the one direction this can be wrong quietly: it accuses a
 * buyer of not ordering something they did order.
 *
 * Six weeks covers a monthly cycle with slack either side. It costs nothing
 * on orders, which come down in one request whatever the span, and it costs
 * pages on receipts, which are walked per store — the slowest wave gets
 * slower, and that is the trade.
 */
export const SUPPLY_LOOKBACK_DAYS = 42;

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
  /**
   * The department's number AT THIS STORE.
   *
   * On the scope rather than beside it, because the two stores do not agree
   * on it. Chapel Hill's 10 is Tobacco and Tupelo's 10 is Deli/Bakery, so a
   * single number asked one store about cigarettes and the other about its
   * bakery and set the two side by side. The report pairs on the name and
   * hands each side its own number; see `deptReport`.
   */
  subDept: number;
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
  tw: Window;
  lw: Window;
  ly: Window;
}

/**
 * One string that stands for everything a fetch depends on.
 *
 * The cache key, and the effect's identity. It lists the scope's fields by
 * hand rather than stringifying the object: a key built by serialising
 * whatever happens to be on Scope would silently start missing cache every
 * time somebody added a field that has nothing to do with the request — which
 * is exactly how `metric` came to be invalidating nine calls.
 */
export const scopeKey = (s: Scope) =>
  [
    s.url,
    s.mine.storeid, s.mine.storeNumber,
    s.theirs.storeid, s.theirs.storeNumber,
    s.mine.subDept,
    s.theirs.subDept,
    s.tw.start, s.tw.end,
    s.lw.start, s.lw.end,
    s.ly.start, s.ly.end,
  ].join("|");

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
      // The store's own number, not the scope's — see Store.subDept.
      store.subDept,
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
  /**
   * Whether the orders actually came back.
   *
   * Four different things used to arrive here as one empty array: the call
   * threw, the API answered with an error, the window held no orders, and
   * the department had none. The panel then said "neither store placed an
   * order -- that is the finding, not a gap in the data", which is a claim
   * only the last two support.
   */
  ok: boolean;
  /**
   * Order lines that came back for these two stores over the window, before
   * the department filter.
   *
   * The difference between "nothing came back" and "plenty came back, none
   * of it this department" is the whole diagnosis, and the panel could not
   * tell them apart.
   */
  inWindow: number;
  /** This department's lines, which is what every figure is built from. */
  mine: AllOrder[];
  theirs: AllOrder[];
  /**
   * Every line on those same orders, department or not.
   *
   * The call fetches whole orders and the filter above throws the rest
   * away. Keeping it costs one array and makes "show me the whole order"
   * free — without it, looking at the other half of an order a buyer is
   * holding would be a request per order.
   */
  allMine: AllOrder[];
  allTheirs: AllOrder[];
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
 *
 * `codes` are the department's product codes, from the sales wave that has
 * already landed. An order line joins this department if it carries one of
 * them OR if its own `sub_department` says so — the receipts search matches
 * by code and finds deliveries where the department filter alone found no
 * orders at all, and an order line's `sub_department` comes off the item
 * master at order time while the sales rows' comes off the transaction, so
 * the two can disagree about the same item.
 */
export const fetchOrders = async (
  scope: Scope,
  codes: string[] = [],
): Promise<OrdersWave> => {
  const wanted = new Set(codes);
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
    if (j.error !== 0)
      return {
        ok: false,
        inWindow: 0,
        mine: [],
        theirs: [],
        allMine: [],
        allTheirs: [],
      };

    const all = j.orders ?? [];
    // Two ways in, because one of them was not enough.
    //
    // By code first: that is how the receipts search finds the department,
    // and it was finding deliveries on windows where this filter found no
    // orders whatsoever.
    //
    // By sub_department second, COERCED rather than compared strictly. The
    // field is TYPED as a number and this payload does not always agree --
    // the same lesson `codesIn` below learned about `product_code`. A string
    // "45" against a number 45 drops every order in the department, and the
    // panel then reports, confidently, that neither store ordered anything.
    // `AllOrder` spells it `storenumber`, with no underscore.
    const forStore = (rows: AllOrder[]) => (s: Store) =>
      scopeRowsToStore(
        rows.filter((o) => o.storeid === s.storeid),
        s.storeNumber,
        (o) => o.storenumber,
      );
    // Narrowed to the store FIRST, then to that store's own department
    // number. One number for both would ask Tupelo for Chapel Hill's
    // department, which at Brooks is a different department.
    const dept = (s: Store) =>
      forStore(all)(s).filter(
        (o) =>
          wanted.has(String(o.product_code ?? "").trim()) ||
          Number(o.sub_department) === Number(s.subDept),
      );
    const whole = forStore(all);

    return {
      ok: true,
      inWindow: all.length,
      mine: dept(scope.mine),
      theirs: dept(scope.theirs),
      allMine: whole(scope.mine),
      allTheirs: whole(scope.theirs),
    };
  } catch {
    return {
      ok: false,
      inWindow: 0,
      mine: [],
      theirs: [],
      allMine: [],
      allTheirs: [],
    };
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
