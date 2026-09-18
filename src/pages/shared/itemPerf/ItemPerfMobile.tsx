import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BackspaceIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import SingleStoreSearchCard from "../../../components/SingleStoreSearchCard";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import BottomSheet from "../../../components/BottomSheet";
import ScannerView from "../../../components/scanner/ScannerView";
import { fetchItemRows } from "./fetchItemRows";
import {
  addDays,
  formatCurrency2,
  formatDateSimple,
  formatGoliathDate,
  getStoreName,
  sameWeekDayLastYear,
} from "../../../utils";
import type { JsonError } from "../../../interfaces";
import { shiftIso } from "../../../utils/grading";
import { applyStoreNumberToName } from "../../../utils/storeIdentity";
import MobileSortChips, {
  type SortOption,
} from "../../../components/mobile/MobileSortChips";
import MobileInfoSheet from "../../../components/mobile/MobileInfoSheet";
import { itemPerfMobileInfo } from "./itemPerfInfo";
import {
  beginItemPerfLoad,
  setItemPerfDimension,
  clearPerfItem,
  failItemPerfLoad,
  setItemPerfGroupSort,
  setItemPerfInfoOpen,
  setItemPerfItemSort,
  setItemPerfStoreNumber,
  type MarginSort,
  closeScanner,
  openScanner,
  scannedUpc,
  selectPerfItem,
  setItemPerfHasSearched,
  setItemPerfRows,
  setItemPerfStore,
  openItemDetail,
  openItemSearch,
  setItemQuery,
  setRecentsOpen,
  showMoreItems,
  toggleItemPerfDay,
  toggleItemPerfGroup,
  type ItemDimension,
  ROWS_PER_PAGE,
  sourceOf,
} from "../../../features/itemPerfSlice";
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
  salesChangePct,
  marginDirOf,
  sortMarginRows,
  type MarginRow,
  type PricedRow,
} from "./itemPerfData";
import MobilePerfCard from "../../../components/mobile/MobilePerfCard";
import MobilePerfDetail from "../../../components/mobile/MobilePerfDetail";
import PairedBars from "../../../components/mobile/perf/PairedBars";
import PerfDayChart from "../../../components/mobile/perf/PerfDayChart";
import PerfCardHeader from "../../../components/mobile/perf/PerfCardHeader";
import { LY_COLOR, TY_COLOR } from "../../../components/mobile/perf/perfColors";

/** How many recents sit in the page before the rest move to a sheet. */
const RECENTS_INLINE = 3;

const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);

const fmtChange = (v: number) =>
  `${v > 0 ? "+" : v < 0 ? "\u2212" : ""}${Math.abs(v).toFixed(1)}%`;

const SORTS: SortOption<MarginSort>[] = [
  { key: "sales", label: "Sales" },
  { key: "profit", label: "Profit" },
  { key: "gpm", label: "GPM" },
  { key: "change", label: "Change vs LY" },
  { key: "name", label: "Name" },
];

interface Props {
  /** What this page groups by. One per page — the same rows could group the
   *  other way, but Sub Dept Margins and Vendors are different pages to a
   *  user and showing both groupings on one screen would blur that. */
  dimension: ItemDimension;
  title: string;
  /** The overview tab's label — "Sub depts" or "Vendors". */
  listLabel: string;
}

/**
 * Margins on mobile, without grading — shared by Sub Dept Margins and Vendors.
 *
 * One paged item read per period, single store, this year against last year.
 * Three views off that one fetch, switched from a bar under the header rather
 * than a control inside a card, because it is navigation and not a filter:
 *
 *   overview  the page's own list, by department or vendor
 *   search    find any item in the store's week, by name, UPC or scan
 *   daily     an item's week day by day, or the picker that gets you there
 *
 * Tapping a department goes to Daily scoped to it — the question after "which
 * department" is always "which item in it".
 *
 * Margin leads throughout: the hero is GPM and each row shows its own
 * percentage. Every bar on the screen — card, day chart and rows — carries
 * sales, so no two bars mean different things; profit dollars are printed
 * beside them. Percent answers how healthy, bars answer how much.
 */
const ItemPerfMobile = ({ dimension, title, listLabel }: Props) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const perf = useAppSelector((s) => s.itemPerf);

  /**
   * Which of the four screens is on.
   *
   * Derived rather than stored: every one of these is already answerable from
   * what is open, and a stored name could disagree with them. An item shows
   * inside whichever screen opened it, which is also what Back returns to.
   */
  const screen: "list" | "items" | "search" | "item" = perf.selectedItemCode
    ? "item"
    : perf.searchOpen
      ? "search"
      : perf.detailOpen && perf.openGroup
        ? "items"
        : "list";

  const scroller = useRef<HTMLDivElement>(null);
  const openCard = useRef<HTMLDivElement>(null);

  /**
   * Narrows the group list by name.
   *
   * Local rather than in the slice: it describes what is being looked for
   * right now, not what the search returned, and it should not survive
   * leaving the screen. The item lists filter through `itemQuery` instead,
   * because that one reaches into how their rows are built.
   */
  const [groupFilter, setGroupFilter] = useState("");

  /**
   * Opening a card brings it to the top of the screen.
   *
   * An accordion has to scroll DOWN as well as up: the card just tapped is
   * usually below the one that was open, so leaving the viewport where it is
   * opens the report off screen.
   */
  useLayoutEffect(() => {
    if (screen !== "list" || !perf.openGroup) return;
    const el = scroller.current;
    const card = openCard.current;
    if (!el || !card) return;
    const offset =
      card.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.scrollTop = Math.max(0, el.scrollTop + offset - 8);
  }, [perf.openGroup?.key, screen]);

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

  /** Categories reads a different endpoint from the other two, so its rows
   *  must not survive a navigation into them. Sub Dept Margins and Vendors
   *  share a source and deliberately keep theirs — moving between those two
   *  regroups rows already in hand. */
  const source = sourceOf(dimension);
  /** Arriving restores whatever this page was last left looking at — see the
   *  stash in itemPerfSlice. Until that lands, the state on screen is still
   *  the page we came from, so nothing may be read from it. */
  const mine = perf.active === dimension;
  useEffect(() => {
    dispatch(setItemPerfDimension(dimension));
  }, [dimension]);

  const fetchItems = async () => {
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
      const [ty, ly] = await Promise.all([
        fetchItemRows(dimension, scope, twStart, twEnd),
        fetchItemRows(dimension, scope, lyDates[0], lyDates[6]).catch(
          () => null,
        ),
      ]);
      dispatch(setItemPerfRows({ ty, ly, gen, source, end: twEnd }));
    } catch (err) {
      dispatch(failItemPerfLoad(gen));
      toast.error("Error loading items: " + (err as JsonError).message);
    }
  };

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

  /**
   * What the blue button does once there is something in the field.
   *
   * The list already filters as you type, so "search" is only meaningful as
   * the last step: put the keyboard away, and if the query has narrowed to a
   * single item — which typing or scanning a full UPC always does — open it.
   * Anything looser stays a list, because picking for you would be a guess.
   */
  const runSearch = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    if (rows.length === 1) dispatch(selectPerfItem(rows[0].key));
  };

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

  /** One recent item. Shared by the panel and the sheet so the two cannot
   *  drift. No bars: recents are a shortcut, not a comparison, and the scale
   *  they would need belongs to a list that is not on screen. */
  const recentRow = (r: MarginRow) => (
    <button
      key={r.key}
      type="button"
      onClick={() => {
        dispatch(setRecentsOpen(false));
        dispatch(selectPerfItem(r.key));
      }}
      className="block w-full border-t border-gray-100 px-3.5 py-3 text-left active:bg-bkg"
    >
      <div className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
          {r.label}
        </span>
        <span className="flex-none font-display text-[13px] font-bold tabular-nums text-content">
          {pct(r.gpm)}
        </span>
        <ChevronRightIcon className="h-4 w-4 flex-none text-content/85" />
      </div>
      <div className="mt-0.5 truncate text-[11px] tabular-nums text-content/85">
        {r.sub} · {formatCurrency2(r.sales)}
      </div>
    </button>
  );

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

  if (
    !mine ||
    !perf.hasSearched ||
    (!perf.loading && perf.itemsTy.length === 0)
  ) {
    return (
      <div className="flex h-[calc(100dvh-3rem)] items-start justify-center overflow-y-auto p-4">
        <SingleStoreSearchCard
          title={title}
          description="Select a store and week ending date."
          buttonLabel="Load items"
          stores={assignedStores}
          selectedStoreId={perf.storeId}
          onStoreSelect={(id) => dispatch(setItemPerfStore(id))}
          onSearch={fetchItems}
          loading={perf.loading}
          loadingMessage="Loading items..."
          datePicker={<SingleDatePicker />}
          onBack={
            // Only when there is something to go back TO. Landing here for the
            // first time has no results behind it.
            perf.itemsTy.length > 0
              ? () => dispatch(setItemPerfHasSearched(true))
              : undefined
          }
          backLabel={`Back to ${listLabel.toLowerCase()}`}
          notice={
            perf.hasSearched
              ? "No items found for that store and week."
              : undefined
          }
        />
      </div>
    );
  }


  /** The margin figures for whatever is in scope. Shared by the group card and
   *  the item screen — same question, different scope. */
  const summaryBody = (
    <div className="px-3.5 pb-3.5 pt-2">
      <div className="flex items-end gap-5">
        <div className="flex flex-col">
          <span className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
            TY margin
          </span>
          <span className="font-display text-[31px] font-extrabold leading-none tracking-tight text-content">
            {pct(totals.gpm)}
          </span>
        </div>
        <div className="flex flex-col pb-0.5">
          <span className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
            LY margin
          </span>
          {/* No record isn't a 0% margin. */}
          <span className="font-display text-[20px] font-bold leading-none tracking-tight text-content/85">
            {cardNoLy ? "no history" : pct(totals.gpmLy)}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wider text-content/85">
          <span>Sales</span>
          <span>
            {selectedItem
              ? `${totals.units.toLocaleString("en-US")} qty`
              : `${totals.itemCount.toLocaleString("en-US")} ${
                  totals.itemCount === 1 ? "item" : "items"
                }`}
          </span>
        </div>
        <PairedBars
          ty={totals.sales}
          ly={totals.salesLy}
          max={Math.max(totals.sales, totals.salesLy)}
          compact
          lyUnavailable={cardNoLy}
        />
        {totalsPartial && (
          <p className="mt-1.5 inline-block rounded bg-gray-200 px-1.5 py-0.5 text-[11px] font-semibold text-content">
            Last year: {weekMatch.lyDays} of {weekMatch.days} days matched
          </p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-gray-100 pt-2.5">
        {/* Columns are the figure, rows are the year: each LY tile sits
            directly under the TY one it compares with. */}
        {[
          { k: "TY gross profit", v: totals.profit, ly: false },
          { k: "TY cost", v: totals.cogs, ly: false },
          { k: "LY gross profit", v: totals.profitLy, ly: true },
          { k: "LY cost", v: totals.cogsLy, ly: true },
        ].map(({ k, v, ly }) => (
          <div key={k} className="flex flex-col">
            <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/85">
              {k}
            </span>
            <span
              className={`font-display text-[15px] font-bold ${
                ly ? "text-content/85" : "text-content"
              }`}
            >
              {ly && cardNoLy ? "no history" : formatCurrency2(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  /** A sortable list of margin rows — groups on the list screen, items below
   *  it, search results beside it. One row shape, three callers. */
  const rowList = (
    onRow: (r: MarginRow) => void,
    emptyText: string,
    /** Item lists filter through `itemQuery`, which is what narrows the rows
     *  as they are built. The group list filters locally — see groupFilter. */
    withQuery = false,
  ) => (
    <>
      {withQuery && (
        <div className="border-b border-gray-100 px-3.5 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-bkg px-3">
            <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/85" />
            <input
              id="item-perf-list-filter"
              value={perf.itemQuery}
              onChange={(e) => dispatch(setItemQuery(e.target.value))}
              placeholder="Description or UPC"
              inputMode="search"
              enterKeyHint="search"
              aria-label="Filter items"
              className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14px] text-content placeholder:text-content/85"
              style={{
                outline: "none",
                WebkitAppearance: "none",
                boxShadow: "none",
              }}
            />
            {perf.itemQuery && (
              <button
                type="button"
                onClick={() => dispatch(setItemQuery(""))}
                aria-label="Clear filter"
                className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/85 active:bg-custom-white"
              >
                <BackspaceIcon className="h-4 w-4" />
              </button>
            )}
            {/* Scanning is how you find a box you are holding, which is the
                reason to be on this screen at all with a phone in your hand. */}
            <button
              type="button"
              onClick={() =>
                dispatch(perf.scannerOpen ? closeScanner() : openScanner())
              }
              aria-label="Scan a barcode"
              aria-pressed={perf.scannerOpen}
              className="-mr-1.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg text-custom-white"
              style={{ background: TY_COLOR }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8v8M11 8v8M15 8v8" />
              </svg>
            </button>
          </div>
          {perf.scannerOpen && (
            <div className="pt-2">
              <ScannerView onDetected={(upc) => dispatch(scannedUpc(upc))} />
            </div>
          )}
        </div>
      )}
      <MobileSortChips
        options={SORTS}
        value={activeSort?.key ?? null}
        dir={activeSortDir}
        onChange={onSort}
      />
      <p className="border-b border-gray-100 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-content/85">
        Bars: sales, TY vs LY
      </p>
      {listPartial && (
        <p className="border-b border-gray-100 bg-gray-100 px-3.5 py-2 text-[11.5px] font-semibold text-content">
          Last year: {weekMatch.lyDays} of {weekMatch.days} days matched
        </p>
      )}
      {building ? (
        // Held back 200ms by the animation delay, so the quick transitions
        // this also covers never flash a spinner.
        <div
          className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/85"
          style={{ animation: "delayed-fade-in 140ms ease-out 200ms both" }}
        >
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200"
            style={{ borderTopColor: TY_COLOR }}
          />
          Building the list...
        </div>
      ) : shown.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
          {emptyText}
          {/* A scan is scoped to the list it was made in, so on Vendors and
              Categories especially it can miss an item the store really does
              sell. Rather than leave that looking like "no such item", offer
              the one list that always covers it. */}
          {withQuery && query && (
            <button
              type="button"
              onClick={() => dispatch(openItemSearch(true))}
              className="mt-3 block w-full text-[12.5px] font-semibold active:opacity-70"
              style={{ color: TY_COLOR }}
            >
              Search the whole store for &ldquo;{query}&rdquo;
            </button>
          )}
        </div>
      ) : (
        <div>
          {shown.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onRow(r)}
              className="block w-full border-t border-gray-100 px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
            >
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                  {r.label}
                </span>
                <span className="flex-none font-display text-[13px] font-bold text-content">
                  {pct(r.gpm)}
                </span>
                <ChevronRightIcon className="h-4 w-4 flex-none text-content/85" />
              </div>
              <div className="mt-0.5 truncate text-[11px] text-content/85">
                {r.sub}
              </div>
              <div className="mt-2">
                <PairedBars
                  ty={r.sales}
                  ly={r.salesLy}
                  max={listMax}
                  lyUnavailable={listNoLy}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {visibleRows.length > shown.length && (
        <button
          type="button"
          onClick={() => dispatch(showMoreItems())}
          className="block w-full border-t border-gray-100 py-3 text-center text-[12px] font-semibold active:bg-bkg"
          style={{ color: TY_COLOR }}
        >
          Show{" "}
          {Math.min(ROWS_PER_PAGE, visibleRows.length - shown.length).toLocaleString(
            "en-US",
          )}{" "}
          more
          <span className="text-content/85">
            {" "}
            · {(visibleRows.length - shown.length).toLocaleString("en-US")} left
          </span>
        </button>
      )}
    </>
  );

  const infoSheet = perf.infoOpen && (
    <MobileInfoSheet
      {...itemPerfMobileInfo(dimension, title)}
      onClose={() => dispatch(setItemPerfInfoOpen(false))}
    />
  );

  /* ── one item's week ──────────────────────────────────────────────── */
  if (screen === "item") {
    return (
      <>
        <MobilePerfDetail
          tabs={[{ key: "week", label: "Week" }]}
          active="week"
          onTab={() => {}}
          scopeName={selectedItem?.product_description ?? "Item"}
          when={`${itemCode ?? ""} · ${windowLabel}`}
          // Back names where it goes, because this screen is reached two ways.
          backLabel={perf.searchOpen ? "Search" : (perf.openGroup?.label ?? "Items")}
          onBack={() => dispatch(clearPerfItem())}
          levelKey={`item|${itemCode ?? ""}`}
        >
          {summaryBody}
          <table className="w-full border-collapse border-t border-gray-100 text-[12.5px]">
            <thead>
              <tr>
                {["Day", "Sales", "Qty", "GPM"].map((h, i) => (
                  <th
                    key={h}
                    className={`border-b border-gray-100 px-2 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-content/85 ${
                      i === 0 ? "pl-3.5 text-left" : "text-right"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyRows.map((d) => (
                <tr key={d.iso}>
                  <td className="border-b border-gray-100 py-2.5 pl-3.5 font-display text-[13px] font-semibold text-content">
                    {d.label}
                  </td>
                  {/* A dash, not a zero: the item did not sell that day, which
                      is not the same as selling nothing. */}
                  <td className="border-b border-gray-100 px-2 py-2.5 text-right text-content/85">
                    {d.absent ? "—" : formatCurrency2(d.sales)}
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-right text-content/85">
                    {d.absent ? "—" : d.units.toLocaleString("en-US")}
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2.5 pr-3.5 text-right font-bold text-content">
                    {d.absent ? "—" : pct(d.gpm)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </MobilePerfDetail>
        {infoSheet}
      </>
    );
  }

  /* ── find an item, anywhere in the store ──────────────────────────── */
  if (screen === "search") {
    return (
      <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
        <header className="flex-shrink-0 border-b border-gray-200 bg-custom-white px-3 pb-2.5 pt-2">
          <button
            type="button"
            onClick={() => dispatch(openItemSearch(false))}
            className="-ml-1.5 flex items-center gap-0.5 rounded-lg py-1 pr-2 text-[12.5px] font-semibold text-content active:bg-bkg"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            {storeName}
          </button>
          <p className="font-display text-[15px] font-bold text-content">
            Find an item
          </p>
          <p className="font-mono text-[11px] tracking-tight text-content/85">
            Anywhere in the store · {windowLabel}
          </p>

          {/* Pinned: the field is how you get anywhere from here, so a long
              result list must not carry it off the screen. */}
          <div className="mt-2 flex gap-2">
            <input
              id="item-perf-search"
              value={perf.itemQuery}
              onChange={(e) => dispatch(setItemQuery(e.target.value))}
              placeholder="Item name or UPC"
              inputMode="search"
              enterKeyHint="search"
              className="min-w-0 flex-1 rounded-lg border-0 bg-bkg px-3 py-2.5 text-[14px] text-content placeholder:text-content/85"
              style={{
                outline: "none",
                WebkitAppearance: "none",
                boxShadow: "none",
              }}
            />
            {/* One button, two jobs — with an empty field there is nothing to
                search, and with a code in it the camera would only overwrite
                what you just typed. */}
            <button
              type="button"
              onClick={() =>
                query
                  ? runSearch()
                  : dispatch(perf.scannerOpen ? closeScanner() : openScanner())
              }
              aria-label={query ? "Search" : "Scan a barcode"}
              aria-pressed={!query && perf.scannerOpen}
              className="flex-none rounded-lg px-3 text-custom-white"
              style={{ background: TY_COLOR }}
            >
              {query ? (
                <MagnifyingGlassIcon className="h-[18px] w-[18px]" />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8v8M11 8v8M15 8v8" />
                </svg>
              )}
            </button>
            {query && (
              <button
                type="button"
                onClick={() => dispatch(setItemQuery(""))}
                aria-label="Clear"
                className="flex-none rounded-lg bg-bkg px-3 text-content/85"
              >
                <BackspaceIcon className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-14">
          <div className="flex flex-col gap-3 p-3">
            {perf.scannerOpen && (
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white p-3 shadow-md">
                <ScannerView onDetected={(upc) => dispatch(scannedUpc(upc))} />
              </section>
            )}

            {/* Recents rather than the catalogue: someone checking the same
                few items through a shift should not retype a UPC, and a list
                of every item in the store is not a useful thing to land on. */}
            {!query && recents.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
                <div className="px-3.5 pb-1 pt-3 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                  Recent items
                </div>
                {recents.slice(0, RECENTS_INLINE).map(recentRow)}
                {recents.length > RECENTS_INLINE && (
                  <button
                    type="button"
                    onClick={() => dispatch(setRecentsOpen(true))}
                    className="block w-full border-t border-gray-100 py-2.5 text-center text-[12px] font-semibold active:bg-bkg"
                    style={{ color: TY_COLOR }}
                  >
                    {recents.length - RECENTS_INLINE} more recent
                  </button>
                )}
              </section>
            )}

            {!query ? (
              <section className="rounded-2xl border border-gray-200 bg-custom-white px-5 py-7 text-center shadow-md">
                <p className="text-[13px] font-semibold text-content">
                  Search the whole store
                </p>
                <p className="mt-1 text-[12px] text-content/85">
                  Type a name or UPC, or scan a barcode. Results carry the
                  department they came from.
                </p>
              </section>
            ) : (
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
                {rowList(
                  (r) => dispatch(selectPerfItem(r.key)),
                  `Nothing matches "${query}".`,
                )}
              </section>
            )}
          </div>
        </div>

        {perf.recentsOpen && (
          <BottomSheet onClose={() => dispatch(setRecentsOpen(false))}>
            <div className="px-4 pb-1 pt-2 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
              Recent items
            </div>
            {recents.map(recentRow)}
          </BottomSheet>
        )}
        {infoSheet}
      </div>
    );
  }

  /* ── the items inside one group ───────────────────────────────────── */
  if (screen === "items") {
    return (
      <>
        <MobilePerfDetail
          tabs={[{ key: "items", label: "Items" }]}
          active="items"
          onTab={() => {}}
          scopeName={`${perf.openGroup?.label ?? ""} · ${storeName}`}
          when={dayLabel || windowLabel}
          backLabel={listLabel}
          onBack={() => dispatch(openItemDetail(false))}
          levelKey={`items|${perf.openGroup?.key ?? ""}`}
        >
          {rowList(
            (r) => dispatch(selectPerfItem(r.key)),
            query
              ? `Nothing matches "${query}".`
              : "Nothing recorded for this selection.",
            true,
          )}
        </MobilePerfDetail>
        {infoSheet}
      </>
    );
  }

  /* ── the store, and its groups ────────────────────────────────────── */
  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {perf.storeNumbers.length > 1 && (
        <div className="flex-shrink-0 border-b border-gray-200 bg-custom-white">
          <MobileSortChips
            label="Location"
            options={perf.storeNumbers.map((n) => ({
              key: n,
              label: `Store ${n}`,
            }))}
            value={perf.storeNumber ?? ""}
            onChange={(n) => dispatch(setItemPerfStoreNumber(n))}
          />
        </div>
      )}

      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow. */}
      <div ref={scroller} className="flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-3 p-3">
          {/* ── the store ───────────────────────────────────────── */}
          {/* Not a card in the accordion: the store's breakdown IS the list
              under it, so there is nothing for it to open. It carries the
              page's controls because there is nowhere above it for them. */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            <PerfCardHeader
              title={storeName}
              label={scopeLabel}
              when={dayLabel || windowLabel}
              onSearch={() => dispatch(setItemPerfHasSearched(false))}
              onInfo={() => dispatch(setItemPerfInfoOpen(true))}
            />
            {summaryBody}
          </section>

          {/* Search spans every department and drives the scanner, so it is a
              place of its own rather than a level under any one group. */}
          <button
            type="button"
            onClick={() => dispatch(openItemSearch(true))}
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-custom-white py-3 text-[12.5px] font-bold text-content shadow-md active:bg-bkg"
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-content/85" />
            Find an item or scan
          </button>

          {/* ── the groups ──────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            <MobileSortChips
              options={SORTS}
              value={activeSort?.key ?? null}
              dir={activeSortDir}
              onChange={onSort}
            />
            <div className="px-3.5 py-2">
              <div className="flex items-center gap-2 rounded-lg bg-bkg px-3">
                <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/85" />
                <input
                  id="item-perf-group-filter"
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  placeholder={`Filter ${listLabel.toLowerCase()}`}
                  inputMode="search"
                  enterKeyHint="search"
                  aria-label={`Filter ${listLabel.toLowerCase()}`}
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14px] text-content placeholder:text-content/85"
                  style={{
                    outline: "none",
                    WebkitAppearance: "none",
                    boxShadow: "none",
                  }}
                />
                {groupFilter && (
                  <button
                    type="button"
                    onClick={() => setGroupFilter("")}
                    aria-label="Clear filter"
                    className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/85 active:bg-custom-white"
                  >
                    <BackspaceIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {building ? (
            <section
              className="rounded-2xl border border-gray-200 bg-custom-white px-4 py-10 text-center text-[12.5px] text-content/85 shadow-md"
              style={{ animation: "delayed-fade-in 140ms ease-out 200ms both" }}
            >
              Building the list...
            </section>
          ) : shown.length === 0 ? (
            <section className="rounded-2xl border border-gray-200 bg-custom-white px-4 py-8 text-center text-[12.5px] text-content/85 shadow-md">
              {groupFilter.trim()
                ? `Nothing matches "${groupFilter.trim()}".`
                : "Nothing recorded for this selection."}
            </section>
          ) : (
            shown.map((r) => {
              const isOpen = perf.openGroup?.key === r.key;
              const change = salesChangePct(r);
              return (
                <div key={r.key} ref={isOpen ? openCard : undefined}>
                  <MobilePerfCard
                    label={r.label}
                    change={change === null ? "—" : fmtChange(change)}
                    bars={
                      <PairedBars
                        ty={r.sales}
                        ly={r.salesLy}
                        max={listMax}
                        lyUnavailable={listNoLy}
                      />
                    }
                    open={isOpen}
                    minimised={!isOpen && perf.openGroup !== null}
                    onToggle={() =>
                      dispatch(
                        toggleItemPerfGroup({ key: r.key, label: r.label }),
                      )
                    }
                  >
                    <div className="border-t border-gray-100">
                      <div className="px-3.5 pb-1 pt-3">
                        <PerfDayChart
                          days={days}
                          // The DEFERRED day, not the live one, so the column
                          // and the figures it scopes move on one render.
                          selected={listFor.day}
                          onToggle={(iso) => dispatch(toggleItemPerfDay(iso))}
                        />
                        <div className="mt-1 flex flex-wrap gap-x-3.5 gap-y-1 px-1 text-[12px] text-content/85">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2 w-3.5 rounded-sm"
                              style={{ background: TY_COLOR }}
                            />
                            This year
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2 w-3.5 rounded-sm"
                              style={{ background: LY_COLOR }}
                            />
                            {weekNoLy ? "Last year: no history" : "Last year"}
                          </span>
                        </div>
                        <p className="px-1 pt-1 text-[12px] text-content/85">
                          {perf.selectedDay
                            ? "Tap the selected day again for the full week."
                            : "Tap a day to scope this department to it."}
                        </p>
                      </div>

                      {summaryBody}

                      <div className="px-3.5 pb-3.5">
                        <button
                          type="button"
                          onClick={() => dispatch(openItemDetail(true))}
                          className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#1e2a4a] py-2.5 text-[12.5px] font-bold text-custom-white active:bg-[#2a3a62]"
                        >
                          View items
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </MobilePerfCard>
                </div>
              );
            })
          )}
        </div>
      </div>

      {infoSheet}
    </div>
  );

};

export default ItemPerfMobile;
