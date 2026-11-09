// Hooks
import { createContext, useContext, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

// Redux
import { setLastStore } from "../../../features/searchSlice";
import {
  beginItemPerfLoad,
  failItemPerfLoad,
  setItemPerfDimension,
  setItemPerfGroupSort,
  setItemPerfItemSort,
  setItemPerfRows,
  setItemPerfStore,
  sourceOf,
} from "../../../features/dev/devItemPerfSlice";

// Utils
import {
  addDays,
  formatDateSimple,
  formatGoliathDate,
  getStoreName,
  sameWeekDayLastYear,
} from "../../../utils";
import { shiftIso } from "../../../utils/grading";
import { applyStoreNumberToName } from "../../../utils/storeIdentity";
import { asLastYearSlots } from "../../../utils/perfPairs";
import { fetchItemRows } from "../utils/fetchItemRows";
import {
  buildDailyRows,
  buildGroupRows,
  buildItemRows,
  buildMarginDays,
  buildMarginTotals,
  isPartialMatch,
  matchWeek,
  noLyHistory,
  findItem,
  priceRows,
  marginDirOf,
  sortMarginRows,
} from "../utils/itemPerfData";

// Interfaces
import type { UIEvent } from "react";
import type { JsonError } from "../../../interfaces";
import type { ItemDimension, MarginSort } from "../../../features/dev/devItemPerfSlice";
import type { MarginRow, PricedRow } from "../utils/itemPerfData";
import type { ItemPerfCtxValue, ItemPerfScreen } from "../interfaces";

/** The week the NEXT search will fetch, and its last-year and last-week
 *  partners. */
export const useNextWeek = () => {
  const search = useAppSelector((s) => s.search);
  // The week the NEXT search will fetch. singleDate is m/d/yyyy off
  // formatDate; Goliath wants yyyy-mm-dd.
  const twEnd = formatGoliathDate(search.singleDate);
  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  /** Each day shifted individually and re-sorted. Shifting only the endpoints
   *  breaks when one lands on a fixed-date holiday: that end snaps to the
   *  holiday while the other keeps a weekday shift. */
  const lyDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        sameWeekDayLastYear(shiftIso(twStart, i)).date,
      ).sort(),
    [twStart],
  );
  /** The same week, seven days back — the fallback for a store with no last
   *  year. Fetched alongside rather than after a miss: the miss is only known
   *  once the answer is in, and a second round trip there is a visible wait. */
  const lwDates = useMemo(
    () => [shiftIso(twStart, -7), shiftIso(twEnd, -7)],
    [twStart, twEnd],
  );
  return { twStart, twEnd, lyDates, lwDates };
};

/** Takes this page's place in the shared slice, seeds the store, and loads a
 *  week of item rows for it. Returns the search card's load. */
export const useItemPerfLoad = (dimension: ItemDimension) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const lastStore = useAppSelector((s) => s.search.lastStore);
  const perf = useAppSelector((s) => s.dev.itemPerf);
  const { twStart, twEnd, lyDates, lwDates } = useNextWeek();

  /** Categories reads a different endpoint from the other two, so its rows
   *  must not survive a navigation into them. Sub Dept Margins and Vendors
   *  share a source and deliberately keep theirs — moving between those two
   *  regroups rows already in hand. */
  const source = sourceOf(dimension);
  useEffect(() => {
    dispatch(setItemPerfDimension(dimension));
  }, [dimension]);

  /**
   * Start on the store the app already knows about.
   *
   * These three pages keep a snapshot each, and the first visit to one starts
   * from nothing — so arriving at Categories after searching Sub Dept Margins
   * asked for the same store again. Sub Dept Margins and Vendors hand each
   * other their rows because they share an endpoint; Categories reads a
   * different one and never qualified, which is why only some of them
   * remembered.
   *
   * `lastStore` is the app's own answer to "which store were they looking
   * at", so seeding from it covers all three, and covers arriving from Sales
   * or anywhere else that sets it. Only a store still assigned to this user:
   * a stale id would preselect something they cannot search.
   */
  useEffect(() => {
    if (perf.storeId !== 0 || lastStore === 0) return;
    if (!assignedStores.some((s) => s.storeid === lastStore)) return;
    dispatch(setItemPerfStore(lastStore));
  }, [perf.storeId, lastStore, assignedStores, dispatch]);

  const fetchItems = async () => {
    // So the next page — and the next visit — starts here rather than asking
    // again.
    dispatch(setLastStore(perf.storeId));
    // Stamped so a result from an earlier load, or another page's, is dropped
    // by the slice rather than landing on this screen.
    const gen = perf.loadGen + 1;
    dispatch(beginItemPerfLoad(gen));
    try {
      const scope = {
        url: context.url,
        token: context.token,
        storeid: perf.storeId,
      };
      /**
       * This year decides whether there is a page; last year only decides
       * whether it can compare.
       *
       * They used to share one `Promise.all`, so a store with no history on
       * the new backend — the endpoint answers with an error, not an empty
       * list — rejected the pair, toasted, and never set `hasSearched`. The
       * reader was left on the search card with a week of perfectly good
       * current rows already in hand.
       *
       * `null` rather than `[]` on the way out: an empty array is a store
       * that traded nothing last year, and that one really should read as a
       * rise from zero.
       */
      const [ty, ly, lw] = await Promise.all([
        fetchItemRows(dimension, scope, twStart, twEnd),
        fetchItemRows(dimension, scope, lyDates[0], lyDates[6]).catch(
          () => null,
        ),
        fetchItemRows(dimension, scope, lwDates[0], lwDates[1]).catch(
          () => null,
        ),
      ]);
      // No last year means both "the endpoint had no records" — which is what
      // a store onboarded this year answers with, and which `fetchSubDeptRows`
      // raises rather than returns — and an outright failure. Either way there
      // is nothing to compare against, so last week stands in where it can.
      //
      // Re-dated into last year's slots before it is stored, so `_day` comes
      // out of `priceRows` already matching what every builder below looks
      // for. See `asLastYearSlots`.
      const haveLy = ly !== null && ly.length > 0;
      const cmp = haveLy ? ly : lw && lw.length > 0 ? asLastYearSlots(lw) : null;
      dispatch(
        setItemPerfRows({
          ty,
          ly: cmp,
          basis: haveLy || cmp === null ? "ly" : "lw",
          gen,
          source,
          end: twEnd,
        }),
      );
    } catch (err) {
      dispatch(failItemPerfLoad(gen));
      toast.error("Error loading items: " + (err as JsonError).message);
    }
  };

  return fetchItems;
};

/**
 * The figures every screen reads, built once a render from the loaded rows:
 * the open scope's totals and days, the list on screen (one render behind, so
 * a tap paints first), recents, the item's week and the labels.
 */
export const useItemPerfView = (
  dimension: ItemDimension,
  listLabel: string,
  groupFilter: string,
) => {
  const dispatch = useAppDispatch();
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const perf = useAppSelector((s) => s.dev.itemPerf);
  const { twEnd } = useNextWeek();

  /**
   * Which of the four screens is on.
   *
   * Derived rather than stored: every one of these is already answerable from
   * what is open, and a stored name could disagree with them. An item shows
   * inside whichever screen opened it, which is also what Back returns to.
   */
  const screen: ItemPerfScreen = perf.selectedItemCode
    ? "item"
    : perf.searchOpen
      ? "search"
      : perf.detailOpen && perf.openGroup
        ? "items"
        : "list";

  /** The week ON SCREEN — the one the rows were loaded for. The search date
   *  is shared with every other page, so reading it here relabelled this week
   *  whenever someone changed the date elsewhere. */
  const viewEnd = perf.loadedEnd ?? twEnd;
  const viewStart = shiftIso(viewEnd, -6);
  /** The seven dates of the window, so a day with no sales still gets a row. */
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => shiftIso(viewStart, i)),
    [viewStart],
  );

  /**
   * Cost of goods is derived once per fetch, not per render.
   *
   * calculateCogs across a store week is thousands of calls, and doing it
   * inside the grouping meant every view switch and keystroke redid all of it.
   * That was the lag.
   */
  // One location at a time when the storeid covers two. The rows come back
  // combined, and adding 369 and 370 together is a store that doesn't exist.
  // storeNumber is only set when this year's rows carry more than one, so a
  // plain filter is safe — and applied to last year too, so a year that only
  // recorded the other location can't stand in for this one.
  const ty = useMemo(
    () =>
      priceRows(
        perf.storeNumber
          ? perf.itemsTy.filter((r) => r.store_number === perf.storeNumber)
          : perf.itemsTy,
      ),
    [perf.itemsTy, perf.storeNumber],
  );
  const ly = useMemo(
    () =>
      priceRows(
        perf.storeNumber
          ? perf.itemsLy.filter((r) => r.store_number === perf.storeNumber)
          : perf.itemsLy,
      ),
    [perf.itemsLy, perf.storeNumber],
  );

  /**
   * Which days of the loaded week last year can be compared on, off the
   * store's own rows — a department quiet on a day the store traded is a zero,
   * not a gap. Around a moving holiday the LY fetch spans more than seven
   * days, and this is also what keeps the dates in between out of every sum.
   */
  const weekMatch = useMemo(() => matchWeek(ty, ly), [ty, ly]);
  /** Last year has some of the week, not all of it. */
  const weekPartial = !perf.lyMissing && isPartialMatch(weekMatch);
  /**
   * Nothing on file last year — the request failed (`lyMissing`), or it
   * answered with no rows for the dates in question. Either way it reads "no
   * history", never a $0.00 nobody measured. Week-level for the legend, and
   * scoped to the selected day for the card.
   */
  const weekNoLy = perf.lyMissing || noLyHistory(weekMatch, null);
  const cardNoLy = perf.lyMissing || noLyHistory(weekMatch, perf.selectedDay);
  /** One store per screen here, so one answer covers every bar on it. */
  const basis = perf.cmpBasis;

  /** The item screen reports on one item; everything else reports on the
   *  group that is open, or the whole store. Search spans the store, so it
   *  narrows to neither. */
  const itemCode = perf.selectedItemCode;
  const groupKey =
    screen === "search" || screen === "list" ? null : (perf.openGroup?.key ?? null);

  const totals = useMemo(
    () =>
      buildMarginTotals(
        ty,
        ly,
        dimension,
        perf.selectedDay,
        groupKey,
        itemCode,
        weekMatch,
      ),
    [ty, ly, dimension, perf.selectedDay, groupKey, itemCode, weekMatch],
  );
  /** Bars and change compare like with like: over only the matched days. */
  const totalsPartial = !perf.selectedDay && weekPartial;

  const days = useMemo(
    () => buildMarginDays(ty, ly, dimension, groupKey, itemCode, weekDates),
    [ty, ly, dimension, groupKey, itemCode, weekDates],
  );

  const query = perf.itemQuery.trim();

  /**
   * What the list shows, per view.
   *
   * Search deliberately does NOT open on every item. It is a find-one-thing
   * screen: recents until you type or scan, then matches. Landing on the whole
   * catalogue makes it indistinguishable from the Daily picker, which IS a
   * browse screen — that difference is the reason both exist.
   */
  /**
   * The inputs the list is built from, held one render behind.
   *
   * Grouping the store week is hundreds of milliseconds on a phone, and React
   * renders synchronously — so the tap appeared to do nothing at all until the
   * list was ready. Deferring these lets the urgent render paint first (the
   * tab underline moves, the search field responds, a notice appears) and the
   * list rebuild follow at low priority.
   *
   * Memoised because useDeferredValue compares by identity: a fresh object
   * every render would read as permanently stale.
   */
  /*
   * Only what the list on screen actually reads.
   *
   * The group list is built from the week and its own sort; it does not know
   * which card is open, and it does not narrow by the item query. Feeding it
   * those anyway meant every tap on a card produced a fresh inputs object,
   * which deferred, which put "Building the list..." in place of the whole
   * list for a frame — collapsing the scroll container, letting the browser
   * clamp the scroll to the top, and then dropping back to the card once the
   * rows returned. That is the jump: a rebuild of a list that never changed.
   *
   * Narrowed to what each screen consumes, opening a card leaves this object
   * identical, so nothing defers and nothing rebuilds.
   */
  const listGroupKey = screen === "items" ? (perf.openGroup?.key ?? null) : null;
  const listQuery = screen === "list" ? "" : query;
  const listInputs = useMemo(
    () => ({
      screen,
      day: perf.selectedDay,
      groupKey: listGroupKey,
      query: listQuery,
      groupSort: perf.groupSort,
      itemSort: perf.itemSort,
    }),
    [
      screen,
      perf.selectedDay,
      listGroupKey,
      listQuery,
      perf.groupSort,
      perf.itemSort,
    ],
  );
  const listFor = useDeferredValue(listInputs);

  /** The list on screen is not the list that was asked for — yet. */
  const building = listFor !== listInputs;

  const rows: MarginRow[] = useMemo(() => {
    // No chip pressed means the order the list was built in.
    const ordered = (
      built: MarginRow[],
      sort: typeof listFor.groupSort,
    ) => (sort ? sortMarginRows(built, sort.key, sort.reversed) : built);

    if (listFor.screen === "list")
      return ordered(
        buildGroupRows(ty, ly, dimension, listFor.day, weekMatch),
        listFor.groupSort,
      );

    if (listFor.screen === "search") {
      if (!listFor.query) return [];
      return ordered(
        buildItemRows(ty, ly, dimension, listFor.day, null, listFor.query, weekMatch),
        listFor.itemSort,
      );
    }

    if (listFor.screen === "items")
      return ordered(
        buildItemRows(
          ty,
          ly,
          dimension,
          listFor.day,
          listFor.groupKey,
          listFor.query,
          weekMatch,
        ),
        listFor.itemSort,
      );

    // The item screen has its own table.
    return [];
  }, [ty, ly, dimension, listFor, weekMatch]);

  /** Recently opened items, resolved back to rows so they carry their figures.
   *  Only built for Search, and only while nothing is typed. */
  const recents: MarginRow[] = useMemo(() => {
    if (screen !== "search" || query || perf.recentItems.length === 0)
      return [];
    // Filtered first. Building every item row to pick eight out of it was
    // several thousand Map writes to answer a question about eight codes.
    const wanted = new Set(perf.recentItems);
    const mine = (r: PricedRow) => wanted.has(r.product_code);
    const all = buildItemRows(
      ty.filter(mine),
      ly.filter(mine),
      dimension,
      null,
      null,
      "",
      weekMatch,
    );
    return perf.recentItems
      .map((code) => all.find((r) => r.key === code))
      .filter((r): r is MarginRow => Boolean(r));
  }, [ty, ly, dimension, screen, perf.recentItems, query, weekMatch]);

  const dailyRows = useMemo(
    () => buildDailyRows(ty, itemCode, weekDates),
    [ty, itemCode, weekDates],
  );

  /** The open item's week, by date, so each day row can draw its own pair. */
  const dayPairs = useMemo(
    () => new Map(days.map((d) => [d.iso, d])),
    [days],
  );
  /** One scale for the seven days, so Monday and Saturday are comparable.
   *  Last year is left out of it when there is no history, the same way the
   *  list scale is — otherwise every bar is measured against a zero nobody
   *  recorded. */
  const dayMax = useMemo(
    () =>
      Math.max(...days.map((d) => Math.max(d.ty, cardNoLy ? 0 : d.ly)), 1),
    [days, cardNoLy],
  );

  /** The group list, narrowed by the filter field. Applied before paging so
   *  "show more" counts what is actually left to show. */
  const visibleRows = useMemo(() => {
    const q = groupFilter.trim().toLowerCase();
    if (screen !== "list" || !q) return rows;
    return rows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) || r.key.toLowerCase().includes(q),
    );
  }, [rows, groupFilter, screen]);

  /** What actually reaches the DOM. An item list covers the whole store week,
   *  and rendering thousands of rows with bars is what made opening it feel
   *  stuck. */
  const shown = visibleRows.slice(0, perf.listLimit);

  // Scaled to the page on screen, not the full result set: with one outlier
  // item off-list, every visible bar would be a sliver.
  // Last year is excluded from the shared scale when it was never read —
  // otherwise a store with no history scales every bar against a zero it did
  // not measure.
  const listPartial = !listFor.day && weekPartial;
  // Store-level, so one answer covers every row in the list.
  const listNoLy = perf.lyMissing || noLyHistory(weekMatch, listFor.day);
  const listMax = shown.reduce(
    (m, r) => Math.max(m, r.sales, listNoLy ? 0 : r.salesLy),
    0,
  );
  const selectedItem = findItem(perf.selectedItemCode, ty, ly);

  const dayLabel = perf.selectedDay
    ? new Date(`${perf.selectedDay}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "numeric",
        day: "numeric",
      })
    : null;

  /** Every active scope, in the order they narrow. Without it a filtered
   *  figure looks like a wrong one. */
  const scopeLabel = [
    // Plain "Margin": the card labels its TY and LY figures itself.
    "Margin",
    selectedItem?.product_description,
    groupKey ? (perf.openGroup?.label ?? null) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const storeName = (() => {
    const name = getStoreName(assignedStores, perf.storeId);
    return perf.storeNumber
      ? applyStoreNumberToName(name, perf.storeNumber, perf.storeNumbers)
      : name;
  })();

  /** Which list sort applies: the page's own list, or an item list. */
  const onGroupList = screen === "list";
  const activeSort = onGroupList ? perf.groupSort : perf.itemSort;
  const activeSortDir = activeSort
    ? marginDirOf(activeSort.key, activeSort.reversed)
    : null;
  const onSort = (key: MarginSort) =>
    dispatch(onGroupList ? setItemPerfGroupSort(key) : setItemPerfItemSort(key));

  const windowLabel = `${formatDateSimple(viewStart)} \u2013 ${formatDateSimple(viewEnd)}`;

  return {
    dimension,
    listLabel,
    screen,
    ty,
    ly,
    weekMatch,
    weekPartial,
    weekNoLy,
    cardNoLy,
    basis,
    itemCode,
    groupKey,
    totals,
    totalsPartial,
    days,
    query,
    listFor,
    building,
    rows,
    recents,
    dailyRows,
    dayPairs,
    dayMax,
    visibleRows,
    shown,
    listPartial,
    listNoLy,
    listMax,
    selectedItem,
    dayLabel,
    scopeLabel,
    storeName,
    activeSort,
    activeSortDir,
    onSort,
    windowLabel,
  };
};

export const ItemPerfCtx = createContext<ItemPerfCtxValue | null>(null);

/** The item-perf screens' shared figures; see useItemPerfView. */
export const useItemPerfCtx = () => {
  const v = useContext(ItemPerfCtx);
  if (!v) throw new Error("useItemPerfCtx outside ItemPerfMobile");
  return v;
};

/**
 * Search and the store list used to share one scroller, so going straight
 * from one to the other kept the offset. This keeps that: the screen last on,
 * and where the shared scroller was left.
 */
export const useScrollCarry = (screen: ItemPerfScreen | null) => {
  const lastScreen = useRef(screen);
  const offset = useRef(0);
  // A parent's layout effect runs after its children's, so a screen mounting
  // in the same commit still reads the screen it came from.
  useLayoutEffect(() => {
    lastScreen.current = screen;
  }, [screen]);
  return useMemo(() => ({ lastScreen, offset }), []);
};

/** A search or list screen's scroller, put where the other one left off when
 *  arriving straight from it (`from`). */
export const useCarriedScroll = (from: ItemPerfScreen) => {
  const { scrollCarry } = useItemPerfCtx();
  const scroller = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (scrollCarry.lastScreen.current === from)
      el.scrollTop = scrollCarry.offset.current;
    scrollCarry.offset.current = el.scrollTop;
  }, [scrollCarry, from]);
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    scrollCarry.offset.current = e.currentTarget.scrollTop;
  };
  return { scroller, onScroll };
};
