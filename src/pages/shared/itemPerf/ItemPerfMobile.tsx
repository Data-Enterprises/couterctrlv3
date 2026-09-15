import { useDeferredValue, useEffect, useMemo, useRef } from "react";
import {
  BackspaceIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useDrillScroll } from "../../../hooks/useDrillScroll";
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
  claimItemPerf,
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
  setItemPerfView,
  setItemQuery,
  setRecentsOpen,
  showMoreItems,
  toggleItemPerfDay,
  toggleItemPerfGroup,
  type ItemDimension,
  type ItemView,
  ROWS_PER_PAGE,
  sourceOf,
} from "../../../features/itemPerfSlice";
import {
  buildDailyRows,
  buildGroupRows,
  buildItemRows,
  buildMarginDays,
  buildMarginTotals,
  findItem,
  priceRows,
  salesChangePct,
  sortMarginRows,
  type MarginRow,
  type PricedRow,
} from "./itemPerfData";
import PairedBars from "../../sales/mobile/perf/PairedBars";
import PerfDayChart from "../../sales/mobile/perf/PerfDayChart";
import PerfCardHeader from "../../sales/mobile/perf/PerfCardHeader";
import { LY_COLOR, TY_COLOR } from "../../sales/mobile/perf/perfColors";

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

  // A group opens its items and an item opens its week, all in one scroll:
  // each level starts at the top, and Back returns to the row you tapped.
  const scroller = useRef<HTMLDivElement>(null);
  useDrillScroll(
    scroller,
    perf.view === "daily" && perf.selectedItemCode
      ? 2
      : perf.view === "daily"
        ? 1
        : 0,
    `${perf.view}|${perf.selectedGroupKey ?? ""}|${perf.selectedItemCode ?? ""}|${perf.storeNumber ?? ""}`,
  );

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
  const mine = perf.source === source;
  useEffect(() => {
    if (!mine) dispatch(claimItemPerf(source));
  }, [mine, source]);

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

  /** Daily narrows to one item only once one is chosen; before that it is the
   *  picker, scoped to the department you arrived from if any. */
  const itemCode = perf.view === "daily" ? perf.selectedItemCode : null;
  const groupKey = perf.view === "search" ? null : perf.selectedGroupKey;

  const totals = useMemo(
    () =>
      buildMarginTotals(
        ty,
        ly,
        dimension,
        perf.selectedDay,
        groupKey,
        itemCode,
      ),
    [ty, ly, dimension, perf.selectedDay, groupKey, itemCode],
  );

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
  const listInputs = useMemo(
    () => ({
      view: perf.view,
      day: perf.selectedDay,
      groupKey: perf.selectedGroupKey,
      itemCode: perf.selectedItemCode,
      query,
      groupSort: perf.groupSort,
      itemSort: perf.itemSort,
    }),
    [
      perf.view,
      perf.selectedDay,
      perf.selectedGroupKey,
      perf.selectedItemCode,
      query,
      perf.groupSort,
      perf.itemSort,
    ],
  );
  const listFor = useDeferredValue(listInputs);

  /** The list on screen is not the list that was asked for — yet. */
  const building = listFor !== listInputs;

  const rows: MarginRow[] = useMemo(() => {
    if (listFor.view === "list")
      return sortMarginRows(
        buildGroupRows(ty, ly, dimension, listFor.day),
        listFor.groupSort,
      );

    if (listFor.view === "search") {
      if (!listFor.query) return [];
      return sortMarginRows(
        buildItemRows(ty, ly, dimension, listFor.day, null, listFor.query),
        listFor.itemSort,
      );
    }

    // Daily's picker: browse everything, or the group arrived from.
    return listFor.itemCode
      ? []
      : sortMarginRows(
          buildItemRows(
            ty,
            ly,
            dimension,
            listFor.day,
            listFor.groupKey,
            listFor.query,
          ),
          listFor.itemSort,
        );
  }, [ty, ly, dimension, listFor]);

  /** Recently opened items, resolved back to rows so they carry their figures.
   *  Only built for Search, and only while nothing is typed. */
  const recents: MarginRow[] = useMemo(() => {
    if (perf.view !== "search" || query || perf.recentItems.length === 0)
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
    );
    return perf.recentItems
      .map((code) => all.find((r) => r.key === code))
      .filter((r): r is MarginRow => Boolean(r));
  }, [ty, ly, dimension, perf.view, perf.recentItems, query]);

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

  /** What actually reaches the DOM. Daily's picker covers the whole store
   *  week, and rendering thousands of rows with bars is what made opening it
   *  feel stuck. */
  const shown = rows.slice(0, perf.listLimit);

  // Scaled to the page on screen, not the full result set: with one outlier
  // item off-list, every visible bar would be a sliver.
  // Last year is excluded from the shared scale when it was never read —
  // otherwise a store with no history scales every bar against a zero it did
  // not measure.
  const listMax = shown.reduce(
    (m, r) => Math.max(m, r.sales, perf.lyMissing ? 0 : r.salesLy),
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
    groupKey ? perf.selectedGroupLabel : null,
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
  const onGroupList = perf.view === "list";
  const activeSort = onGroupList ? perf.groupSort : perf.itemSort;

  const VIEWS: { key: ItemView; label: string }[] = [
    { key: "list", label: listLabel },
    { key: "search", label: "Search" },
    { key: "daily", label: "Daily" },
  ];

  /** The summary card describes a scope. On the pickers nothing is chosen
   *  yet, so there is nothing for it to describe. */
  const showPicker =
    perf.view === "search" || (perf.view === "daily" && !itemCode);

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
          notice={
            perf.hasSearched
              ? "No items found for that store and week."
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* The view bar sits above the scroll, directly under the app header.
          Inside a card it read as a filter on that card; here it reads as
          where you are. */}
      <nav className="flex flex-shrink-0 border-b border-gray-200 bg-custom-white">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => dispatch(setItemPerfView(v.key))}
            aria-current={perf.view === v.key ? "page" : undefined}
            className={`flex-1 border-r border-gray-100 py-3 text-[12.5px] font-semibold last:border-r-0 ${
              perf.view === v.key ? "text-content" : "text-content/85"
            }`}
            style={
              perf.view === v.key
                ? { boxShadow: `inset 0 -2px 0 ${TY_COLOR}` }
                : undefined
            }
          >
            {v.label}
          </button>
        ))}
      </nav>

      {perf.storeNumbers.length > 1 && (
        <div className="flex-shrink-0 border-b border-gray-200 bg-custom-white">
          <MobileSortChips
            label="Location"
            options={perf.storeNumbers.map((n) => ({ key: n, label: `Store ${n}` }))}
            value={perf.storeNumber ?? ""}
            onChange={(n) => dispatch(setItemPerfStoreNumber(n))}
          />
        </div>
      )}

      {/* Pinned above the scroll. The field is how you get anywhere from these
          two views, so scrolling a long result list must not carry it off the
          screen — pb-0 lets the scroll container's own p-3 supply the gap. */}
      {showPicker && (
        <div className="flex-shrink-0 p-3 pb-0">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            <div className="flex gap-2 p-3">
              <input
                value={perf.itemQuery}
                onChange={(e) => dispatch(setItemQuery(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
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
              {/* One button, two jobs — because with an empty field there is
                  nothing to search, and with a code in it the camera would
                  only overwrite what you just typed. */}
              <button
                type="button"
                onClick={() =>
                  query
                    ? runSearch()
                    : dispatch(
                        perf.scannerOpen ? closeScanner() : openScanner(),
                      )
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

            {perf.scannerOpen && (
              <div className="px-3 pb-3">
                <ScannerView onDetected={(upc) => dispatch(scannedUpc(upc))} />
              </div>
            )}

            {perf.view === "daily" && perf.selectedGroupLabel && (
              <button
                type="button"
                onClick={() =>
                  dispatch(
                    toggleItemPerfGroup({
                      key: perf.selectedGroupKey!,
                      label: perf.selectedGroupLabel!,
                    }),
                  )
                }
                className="mx-3 mb-3 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-lg bg-row_selected px-2.5 py-2 text-[12px] font-semibold text-content/85"
              >
                <span className="truncate">
                  Items in {perf.selectedGroupLabel}
                </span>
                <span
                  className="flex-none font-mono text-[10.5px] uppercase tracking-wider"
                  style={{ color: TY_COLOR }}
                >
                  All items
                </span>
              </button>
            )}
          </section>
        </div>
      )}

      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow. */}
      <div ref={scroller} className="flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-3 p-3">
          {/* ── back out of an item ─────────────────────────────── */}
          {/* Spelled out rather than a bare chevron: this screen is reached
              two different ways, so the control has to say which one it
              undoes. */}
          {perf.view === "daily" && itemCode && (
            <button
              type="button"
              onClick={() => dispatch(clearPerfItem())}
              className="-mb-1 flex items-center gap-0.5 self-start rounded-lg py-1 pl-0.5 pr-2 text-[12.5px] font-semibold active:bg-row_selected"
              style={{ color: TY_COLOR }}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              {perf.itemOrigin === "search"
                ? "Back to search"
                : perf.selectedGroupLabel
                  ? `Back to ${perf.selectedGroupLabel}`
                  : "Back to items"}
            </button>
          )}

          {/* ── margin summary ─────────────────────────────────── */}
          {!showPicker && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
              <PerfCardHeader
                title={
                  selectedItem?.product_description ??
                  perf.selectedGroupLabel ??
                  storeName
                }
                label={scopeLabel}
                when={
                  dayLabel ||
                  `${formatDateSimple(viewStart)} – ${formatDateSimple(viewEnd)}`
                }
                onSearch={() => dispatch(setItemPerfHasSearched(false))}
                onInfo={() => dispatch(setItemPerfInfoOpen(true))}
              />

              <div className="px-4 pb-4 pt-2">
                {/* Margin this year and last, side by side. This year leads;
                    last year sits beside it smaller, as the reference. */}
                <div className="mt-1.5 flex items-end gap-5">
                  <div className="flex flex-col">
                    <span className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                      TY margin
                    </span>
                    <span className="font-display text-[31px] font-extrabold leading-none tracking-tight tabular-nums text-content">
                      {pct(totals.gpm)}
                    </span>
                  </div>
                  <div className="flex flex-col pb-0.5">
                    <span className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                      LY margin
                    </span>
                    {/* No record isn't a 0% margin. */}
                    <span className="font-display text-[20px] font-bold leading-none tracking-tight tabular-nums text-content/85">
                      {perf.lyMissing ? "no history" : pct(totals.gpmLy)}
                    </span>
                  </div>
                </div>

                {/* Sales this year against last, like every other bar on the
                    screen. Profit dollars live in the tiles below. */}
                <div className="mt-3">
                  <div className="mb-1.5 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wider text-content/85">
                    <span>Sales</span>
                    {/* The count the grid below used to carry; it describes
                        what was sold, so it sits with the sales. */}
                    <span className="tabular-nums">
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
                    lyUnavailable={perf.lyMissing}
                  />
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-3">
                  {/* Columns are the figure, rows are the year: each LY tile
                      sits directly under the TY one it compares with. */}
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
                        className={`font-display text-[15px] font-bold tabular-nums ${
                          ly ? "text-content/85" : "text-content"
                        }`}
                      >
                        {ly && perf.lyMissing ? "no history" : formatCurrency2(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── the week, and the day filter ────────────────────── */}
          {/* Overview only. On a single item the daily table below says the
              same thing with actual figures, and on the pickers there is
              nothing chosen for it to describe. */}
          {perf.view === "list" && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white px-3 pb-3 pt-3 shadow-md">
              <PerfDayChart
                days={days}
                // The DEFERRED day, not the live one. Reading the live value
                // highlighted the column on the frame of the tap while the
                // rows below stayed on the old day until the rebuild landed —
                // a control moving before its consequences, which is what read
                // as twitch. Chart and list now change together.
                selected={listFor.day}
                onToggle={(iso) => dispatch(toggleItemPerfDay(iso))}
              />
              <div className="mt-1 flex flex-wrap gap-x-3.5 gap-y-1 px-1 text-[12px] text-content/85">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-3.5 rounded-sm" style={{ background: TY_COLOR }} />
                  This year
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-3.5 rounded-sm" style={{ background: LY_COLOR }} />
                  {/* No record isn't a zero — the columns can't say so, the
                      legend can. */}
                  {perf.lyMissing ? "Last year: no history" : "Last year"}
                </span>
              </div>
              <p className="px-1 pt-1.5 text-[12px] text-content/85">
                {perf.selectedDay
                  ? "Tap the selected day again for the full week."
                  : "Sales by day. Tap one to scope the screen to it."}
              </p>
            </section>
          )}

          {/* ── recents, while Search is waiting for a query ────── */}
          {perf.view === "search" && !query && recents.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
              <div className="px-3.5 pb-1 pt-3 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                Recently viewed
              </div>
              {/* Only the top few sit in the page. A full list would push the
                  search field — the reason you are on this screen — off the
                  top of a phone. The rest open over the page instead. */}
              {recents.slice(0, RECENTS_INLINE).map(recentRow)}
              {recents.length > RECENTS_INLINE && (
                <button
                  type="button"
                  onClick={() => dispatch(setRecentsOpen(true))}
                  className="block w-full border-t border-gray-100 py-2.5 text-center text-[12px] font-semibold active:bg-bkg"
                  style={{ color: TY_COLOR }}
                >
                  View all {recents.length} recent
                </button>
              )}
            </section>
          )}

          {perf.recentsOpen && (
            <BottomSheet onClose={() => dispatch(setRecentsOpen(false))}>
              <div className="flex-shrink-0 px-3.5 pb-1 pt-1 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                Recently viewed
              </div>
              <div className="overflow-y-auto pb-4">
                {recents.map(recentRow)}
              </div>
            </BottomSheet>
          )}

          {/* ── what Search is for, before anything is typed ─────── */}
          {perf.view === "search" && !query && (
            <section className="rounded-2xl border border-gray-200 bg-custom-white px-5 py-7 text-center shadow-md">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-bkg text-content/85">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
              <div className="font-display text-[13.5px] font-bold text-content">
                Scan or type to find an item
              </div>
              <div className="mx-auto mt-1 max-w-[34ch] text-[11.5px] leading-relaxed text-content/85">
                Searches the{" "}
                {new Set(ty.map((r) => r.product_code)).size.toLocaleString(
                  "en-US",
                )}{" "}
                items already loaded for this store and week — no wait.
              </div>
            </section>
          )}

          {/* ── the list, or the daily table ────────────────────── */}
          {!(perf.view === "search" && !query) && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
              {!(perf.view === "daily" && itemCode) && (
                <>
                  <MobileSortChips
                    options={SORTS}
                    value={activeSort}
                    onChange={(key) =>
                      dispatch(
                        onGroupList
                          ? setItemPerfGroupSort(key)
                          : setItemPerfItemSort(key),
                      )
                    }
                  />
                  {/* Rows print a margin, and often a profit figure, beside
                      the bars; this says which one the bars are. */}
                  <p className="border-b border-gray-100 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-content/85">
                    Bars: sales, TY vs LY
                  </p>
                </>
              )}
              {building ? (
                // Held back 200ms by the animation delay, so the quick
                // transitions this also covers never flash a spinner.
                <div
                  className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/85"
                  style={{
                    animation: "delayed-fade-in 140ms ease-out 200ms both",
                  }}
                >
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200"
                    style={{ borderTopColor: TY_COLOR }}
                  />
                  Building the list...
                </div>
              ) : perf.view === "daily" && itemCode ? (
                <table className="w-full border-collapse text-[12.5px] tabular-nums">
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
                        {/* A dash, not a zero: the item did not sell that day,
                          which is not the same as selling nothing. */}
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
              ) : shown.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
                  {perf.itemQuery
                    ? `Nothing matches "${perf.itemQuery}".`
                    : "Nothing recorded for this selection."}
                </div>
              ) : (
                <div>
                {shown.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() =>
                      perf.view === "list"
                        ? dispatch(
                            toggleItemPerfGroup({ key: r.key, label: r.label }),
                          )
                        : dispatch(selectPerfItem(r.key))
                    }
                    className="block w-full border-t border-gray-100 px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
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
                      {r.sub}
                      {/* The figure a sort orders on when the row doesn't
                          already show it, only while it is the sort —
                          otherwise it's one more number. Group rows carry
                          profit in their subtitle already. */}
                      {activeSort === "profit" &&
                        perf.view !== "list" &&
                        ` · ${formatCurrency2(r.profit)} gross profit`}
                      {activeSort === "change" &&
                        !perf.lyMissing &&
                        ` · sales ${(() => {
                          const c = salesChangePct(r);
                          return c === null ? "no LY" : `${fmtChange(c)} vs LY`;
                        })()}`}
                    </div>
                    <div className="mt-2">
                      <PairedBars
                        ty={r.sales}
                        ly={r.salesLy}
                        max={listMax}
                        lyUnavailable={perf.lyMissing}
                      />
                    </div>
                  </button>
                ))}
                </div>
              )}

              {rows.length > shown.length && (
                <button
                  type="button"
                  onClick={() => dispatch(showMoreItems())}
                  className="block w-full border-t border-gray-100 py-3 text-center text-[12px] font-semibold active:bg-bkg"
                  style={{ color: TY_COLOR }}
                >
                  Show{" "}
                  {Math.min(
                    ROWS_PER_PAGE,
                    rows.length - shown.length,
                  ).toLocaleString("en-US")}{" "}
                  more
                  <span className="text-content/85">
                    {" "}
                    · {(rows.length - shown.length).toLocaleString(
                      "en-US",
                    )}{" "}
                    left
                  </span>
                </button>
              )}
            </section>
          )}

          {perf.view === "daily" && !itemCode && rows.length > 0 && (
            <p className="px-1 pb-2 text-center text-[11.5px] text-content/85">
              {rows.length.toLocaleString("en-US")} items
              {perf.selectedGroupLabel ? ` in ${perf.selectedGroupLabel}` : ""}.
              Tap one for its week.
            </p>
          )}
        </div>
      </div>

      {perf.infoOpen && (
        <MobileInfoSheet
          {...itemPerfMobileInfo(dimension, title)}
          onClose={() => dispatch(setItemPerfInfoOpen(false))}
        />
      )}
    </div>
  );
};

export default ItemPerfMobile;
