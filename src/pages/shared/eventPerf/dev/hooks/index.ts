// Hooks
import { createContext, useContext, useDeferredValue, useEffect, useMemo, useRef } from "react";
import { useStore } from "react-redux";
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import {
  beginEventLoad,
  claimEventPerf,
  failEventLoad,
  failReceipt,
  GROUP_KEY,
  setEventData,
  setEventLoadProgress,
  setReceiptLines,
} from "../../../../../features/dev/devEventPerfSlice";

// Utils
import { formatCurrency2, formatDateSimple } from "../../../../../utils";
import {
  buildEventDays,
  buildGroupRows,
  buildLensBusiest,
  buildLensCards,
  buildReceipts,
  buildTotals,
  defaultEventSort,
} from "../utils";
import { fmtInt, shortDay } from "../utils/display";

// Interfaces
import type { RootState } from "../../../../../store";
import type { JsonError } from "../../../../../interfaces";
import type { EventView } from "../../../../../features/dev/devEventPerfSlice";
import type { EventScope, EventTotals } from "../utils";
import type { EventPerfCtxValue, EventPerfMobileProps } from "../interfaces";

/**
 * Everything the event screens read, built once a render: the load, the two
 * scopes (deferred, so a tap paints first), the lens cards, the open card's
 * week and totals, the store, cashier and receipt lists, and the labels.
 */
export const useEventPerfView = (
  {
    pageKey,
    start,
    end,
    title,
    measure,
    load,
    loadReceipt,
  }: EventPerfMobileProps,
  storeFilter: string,
) => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const toast = useToast();
  const perf = useAppSelector((s) => s.dev.eventPerf);

  /** Where the list was left. It unmounts while the detail view is up, so the
   *  position has to survive outside the DOM. */
  const listScroll = useRef(0);

  /** Whatever is in the slice belongs to this page. Checked in render as well
   *  as cleared in the effect, so the other page's rows never paint for the
   *  frame before the reset lands. */
  const mine = perf.owner === pageKey;
  useEffect(() => {
    if (!mine) dispatch(claimEventPerf(pageKey));
  }, [mine, pageKey]);

  /** The seven dates of the week that was LOADED, so a day with no activity
   *  still gets a column. Not the `start` prop: that follows the search card's
   *  picker, which can move without a search ever running. Parsed at midday:
   *  a UTC-parsed ISO date read back in local time lands a day early, which
   *  would shift the whole chart. */
  const loadedStart = perf.loadedStart ?? start;
  const weekDates = useMemo(() => {
    const d0 = new Date(`${loadedStart}T12:00:00`);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(d0);
      d.setDate(d.getDate() + i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
  }, [loadedStart]);

  /**
   * Load the week, tagged with the generation it started under.
   *
   * Every dispatch that follows carries the tag, and the slice drops any whose
   * tag is no longer current — the other page claimed the slice, or a newer
   * search started. The generation is read back off the store rather than
   * predicted, so two taps in one frame cannot share one.
   */
  const runSearch = async () => {
    dispatch(beginEventLoad({ owner: pageKey, message: "Loading..." }));
    const tag = { owner: pageKey, gen: store.getState().dev.eventPerf.loadGen };
    const current = () => {
      const s = store.getState().dev.eventPerf;
      return s.owner === tag.owner && s.loadGen === tag.gen;
    };
    try {
      const result = await load(start, end, (message) =>
        dispatch(setEventLoadProgress({ ...tag, message })),
      );
      dispatch(
        setEventData({
          ...tag,
          rows: result.rows,
          baseline: result.baseline,
          lenses: result.lenses,
          start,
        }),
      );
    } catch (err) {
      // A search nobody is waiting for any more fails quietly.
      if (current())
        toast.error(`Error loading ${title}: ` + (err as JsonError).message);
      dispatch(failEventLoad(tag));
    }
  };

  /**
   * The scope everything reads from, held one render behind.
   *
   * Regrouping thousands of events is synchronous, so a swipe otherwise looked
   * like it did nothing until the new list was ready. Deferring lets the card
   * and a building notice paint first. Memoised because useDeferredValue
   * compares by identity — a fresh object every render would read as
   * permanently stale.
   */
  /** The group card is a card in the same accordion, so "which is open" stays
   *  one question with one answer. */
  const groupOpen = perf.selectedStoreKey === GROUP_KEY;

  /**
   * Two scopes, because the group card and a store card ask different
   * questions.
   *
   * The group's day is the screen's scope — it re-scopes every store row in
   * the list below, and a store card opens on it. A store card's day is local
   * to that card and is dropped when another opens, because a day picked while
   * reading one store says nothing about the next.
   */
  const groupScope: EventScope = useMemo(
    () => ({
      lens: perf.lens,
      day: perf.groupDay,
      storeKey: null,
      cashierKey: null,
    }),
    [perf.lens, perf.groupDay],
  );

  const cardScope: EventScope = useMemo(
    () => ({
      lens: perf.lens,
      day: groupOpen ? perf.groupDay : (perf.selectedDay ?? perf.groupDay),
      // The group card is every store, so it scopes to none.
      storeKey: groupOpen ? null : perf.selectedStoreKey,
      cashierKey: perf.selectedCashierKey,
    }),
    [
      perf.lens,
      perf.groupDay,
      perf.selectedDay,
      perf.selectedStoreKey,
      perf.selectedCashierKey,
      groupOpen,
    ],
  );

  const shownGroup = useDeferredValue(groupScope);
  const shownCard = useDeferredValue(cardScope);

  /**
   * Two rebuild flags, because the two scopes move independently.
   *
   * Only the group's scope can restate the store list — opening a card changes
   * the CARD's scope and nothing about the list it sits in. Sharing one flag
   * meant a tap replaced the whole list with a spinner, the page collapsed to
   * nothing, the browser clamped the scroll to the top, and the card someone
   * had just opened came back off screen.
   */
  const listBuilding = shownGroup !== groupScope;
  const detailBuilding = shownCard !== cardScope;

  /** What the old single scope meant, for the pieces that still read one. */
  const shown = shownCard;

  /**
   * Null first: the carousel opens on everything, and swiping narrows.
   *
   * One event type collapses to a single card. "All" and "the only one" are
   * the same set, so the second card would repeat the first figure for figure
   * — which is exactly what Coupon Sales looked like on a week of nothing but
   * vendor coupons.
   */
  const pages = useMemo<(string | null)[]>(
    () => (perf.lenses.length > 1 ? [null, ...perf.lenses] : [null]),
    [perf.lenses],
  );
  const pageIndex = Math.max(pages.indexOf(perf.lens), 0);

  /**
   * A card's figures for every lens, not just the open one — a swipe should
   * land on a card already filled in rather than one that pops.
   *
   * Built off the DEFERRED scope, like everything else on the screen. Reading
   * the urgent one put the page's heaviest work inside the render that is
   * supposed to paint immediately, so every day tap and row tap stuttered
   * before the list even started rebuilding.
   */
  const cardTotals = useMemo(
    () => buildLensCards(perf.rows, perf.baseline, shownGroup, pages),
    [pages, perf.rows, perf.baseline, shownGroup],
  );

  /** The week for whichever card is open. */
  const days = useMemo(
    () =>
      buildEventDays(perf.rows, perf.baseline, shownCard, weekDates, measure),
    [perf.rows, perf.baseline, shownCard, weekDates, measure],
  );

  /** The open store's own figures. Null while the group card is the open one —
   *  the carousel above already carries the group's. */
  const storeTotals = useMemo(
    () =>
      groupOpen || !perf.selectedStoreKey
        ? null
        : buildTotals(perf.rows, perf.baseline, shownCard),
    [groupOpen, perf.selectedStoreKey, perf.rows, perf.baseline, shownCard],
  );

  const query = perf.query.trim();
  const deferredQuery = useDeferredValue(query);

  /** Busiest day per card, each for its own lens — see buildLensBusiest. */
  const cardBusiest = useMemo(
    () => buildLensBusiest(perf.rows, shownGroup, pages, weekDates, measure),
    [perf.rows, shownGroup, pages, weekDates, measure],
  );

  /** Busiest day for the open store, on its own scope. */
  const storeBusiest = useMemo(
    () =>
      buildLensBusiest(perf.rows, shownCard, [perf.lens], weekDates, measure)[0],
    [perf.rows, shownCard, perf.lens, weekDates, measure],
  );

  const storeSortState = perf.sort.stores;
  const storeSort = storeSortState?.key ?? defaultEventSort(measure);
  const storeReversed = storeSortState?.reversed ?? false;
  const cashierSortState = perf.sort.cashiers;
  const cashierSort = cashierSortState?.key ?? defaultEventSort(measure);
  const cashierReversed = cashierSortState?.reversed ?? false;

  /** The screen's own list: every store, on the group's day. */
  const storeRows = useMemo(
    () =>
      buildGroupRows(
        perf.rows,
        perf.baseline,
        shownGroup,
        "store",
        measure,
        storeSort,
        storeReversed,
      ),
    [perf.rows, perf.baseline, shownGroup, measure, storeSort, storeReversed],
  );

  /** Narrowed by the filter. Must sit with the other hooks, above the early
   *  returns — the search screen and the results screen have to run the same
   *  hooks in the same order. */
  const visibleStores = useMemo(() => {
    const q = storeFilter.trim().toLowerCase();
    if (!q) return storeRows;
    return storeRows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.key.toLowerCase().includes(q) ||
        r.sub.toLowerCase().includes(q),
    );
  }, [storeRows, storeFilter]);

  /** The detail view's lists, on the open card's scope. */
  const cashierRows = useMemo(() => {
    if (!perf.detailOpen || perf.view !== "cashiers") return [];
    return buildGroupRows(
      perf.rows,
      perf.baseline,
      shownCard,
      "cashier",
      measure,
      cashierSort,
      cashierReversed,
    );
  }, [perf.rows, perf.baseline, shownCard, perf.detailOpen, perf.view, measure, cashierSort, cashierReversed]);

  const receipts = useMemo(() => {
    if (!perf.detailOpen || perf.view !== "receipts") return [];
    return buildReceipts(perf.rows, shownCard, deferredQuery);
  }, [perf.rows, shownCard, perf.detailOpen, perf.view, deferredQuery]);

  // Opening a receipt may be a fetch (LP) or a filter (Coupons). Either way
  // the sheet mounts immediately and fills in, rather than the tap hanging.
  // The lines land in the slice tagged with the receipt and the load, so one
  // that arrives after the sheet has moved on is dropped there.
  useEffect(() => {
    if (!perf.openSaleId) return;
    const t = receipts.find((r) => r.saleId === perf.openSaleId);
    if (!t) return;
    const tag = {
      owner: pageKey,
      gen: store.getState().dev.eventPerf.loadGen,
      saleId: t.saleId,
    };
    loadReceipt(t.saleId, t.day, t.storeid)
      .then((lines) => dispatch(setReceiptLines({ ...tag, lines })))
      .catch(() => dispatch(failReceipt(tag)));
  }, [perf.openSaleId]);

  const openTxn = receipts.find((r) => r.saleId === perf.openSaleId) ?? null;
  const openReceiptState =
    perf.receipt && perf.receipt.saleId === perf.openSaleId
      ? perf.receipt
      : null;

  /** Single-store searches skip the store list, the same rule Sales follows —
   *  a one-row list asks you to confirm something you already said. */
  const multiStore = (cardTotals[0]?.stores ?? 0) > 1;

  /** A single-store search has no list to accordion, so its one card is always
   *  open and carries the page's controls itself. */
  const groupAlwaysOpen = !multiStore;
  const scopeOpen = groupAlwaysOpen || groupOpen;

  // The view key stays "receipts" — that is what the bottom sheet renders, and
  // it is the word for one of these. The TAB names the list, and a list of them
  // is transactions, which is also what the card above counts.
  const DETAIL_TABS: { key: EventView; label: string }[] = [
    { key: "cashiers", label: "Cashiers" },
    { key: "receipts", label: "Transactions" },
  ];

  const hasResults = mine && perf.hasSearched && perf.rows.length > 0;

  const valueOf = (t: EventTotals) =>
    measure === "amount" ? t.amount : t.transactions;
  const baseOf = (t: EventTotals) =>
    measure === "amount" ? t.baselineAmount : t.baselineTransactions;
  const fmt = measure === "amount" ? formatCurrency2 : fmtInt;


  /** The day, when one is picked. It takes the window's place on the header
   *  line rather than sitting beside it — see PerfCardHeader. */
  const dayLabel = shortDay(shown.day);

  /** Names the hero figure. The number alone did not say whether it was
   *  dollars or a count, or whether it was the week or the tapped day. */
  const heroCaption = `${measure === "amount" ? "Amount" : "Transactions"} ${
    dayLabel ? "on the selected day" : "this week"
  }`;

  const weekLabel = `${formatDateSimple(weekDates[0])} – ${formatDateSimple(weekDates[6])}`;

  /** The type on screen. The picker lists them all; this is the one chosen. */
  const current = cardTotals[pageIndex] ?? cardTotals[0];

  /** The group's day names the list; a card's names that card. */
  const groupDayLabel = shortDay(shownGroup.day);

  const listRows = visibleStores.slice(0, perf.listLimit);
  const listMax = Math.max(
    ...listRows.map((r) =>
      Math.max(
        measure === "amount" ? r.amount : r.transactions,
        r.baseline ?? 0,
      ),
    ),
    1,
  );
  const shownCashiers = cashierRows.slice(0, perf.listLimit);
  const shownReceipts = receipts.slice(0, perf.listLimit);

  /** What the detail view's rows belong to. */
  const detailScope =
    perf.selectedStoreLabel ?? cardTotals[0]?.storeName ?? "All stores";

  return {
    perf,
    mine,
    listScroll,
    runSearch,
    groupOpen,
    shownGroup,
    shownCard,
    listBuilding,
    detailBuilding,
    pages,
    pageIndex,
    cardTotals,
    days,
    storeTotals,
    cardBusiest,
    storeBusiest,
    visibleStores,
    cashierRows,
    receipts,
    openTxn,
    openReceiptState,
    multiStore,
    groupAlwaysOpen,
    scopeOpen,
    DETAIL_TABS,
    hasResults,
    valueOf,
    baseOf,
    fmt,
    dayLabel,
    heroCaption,
    weekLabel,
    current,
    groupDayLabel,
    listRows,
    listMax,
    shownCashiers,
    shownReceipts,
    detailScope,
  };
};

export const EventPerfCtx = createContext<EventPerfCtxValue | null>(null);

/** The event screens' shared figures; see useEventPerfView. */
export const useEventPerfCtx = () => {
  const v = useContext(EventPerfCtx);
  if (!v) throw new Error("useEventPerfCtx outside EventPerfMobile");
  return v;
};
