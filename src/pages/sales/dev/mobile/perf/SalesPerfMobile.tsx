import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import SearchCard from "../../../../../components-dev/SearchCard";
import { getHourly, getSubs, getWeekly } from "../../../../../api/sales";
import {
  fetchSubDeptRows,
  fetchSubDeptRowsSafe,
} from "../../../../../utils/marginRows";
import { withProductCode } from "../../shared/ledgerUtils";
import InfoModal from "../../../../../components-dev/InfoModal";
import MobileSortChips, {
  type SortOption,
} from "../../../../../components-dev/mobile/MobileSortChips";
import type { DetailTab } from "../../../../../components-dev/mobile/MobilePerfDetail";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  addDays,
  formatCurrency2,
  formatDateSimple,
  formatGoliathDate,
  resolveStoreName,
  sameWeekDayLastYear,
} from "../../../../../utils";
import { isGroupSearch } from "../../../../../features/searchSlice";
import type { JsonError, SubDeptMargin } from "../../../../../interfaces";
import {
  cachePerfItems,
  cachePerfStoreData,
  clearPerfStoreCache,
  emptyBundle,
  failPerfItems,
  failPerfStoreData,
  GROUP_KEY,
  openPerfDetail,
  openPerfSubDept,
  setPerfDrill,
  setPerfGroupData,
  setPerfHasSearched,
  setPerfInfoOpen,
  setPerfItemLoading,
  setPerfItemQuery,
  setPerfItemSort,
  setPerfLoading,
  setPerfSort,
  setPerfStoreSort,
  setPerfStoreLoading,
  setPerfWeek,
  togglePerfDay,
  togglePerfGroupDay,
  togglePerfStore,
  type PerfBundle,
} from "../../../../../features/dev/devSalesPerfSlice";
import {
  buildDays,
  buildHourPairs,
  buildItemPairs,
  buildStorePairs,
  buildSubPairs,
  buildTotals,
  dirOf,
  filterItemPairs,
  fmtChange,
  isPartialMatch,
  matchedNote,
  noLyHistory,
  pairChangePct,
  scopeMatch,
  sortPairs,
  storeKeyOf,
  type PairSort,
} from "./perfData";
import PairedBars from "../../../../../components-dev/mobile/perf/PairedBars";
import PerfCardHeader from "../../../../../components-dev/mobile/perf/PerfCardHeader";
import MobilePerfCard from "../../../../../components-dev/mobile/MobilePerfCard";
import MobilePerfDetail from "../../../../../components-dev/mobile/MobilePerfDetail";
import PerfStoreReport from "./PerfStoreReport";
import PerfDrillList from "./PerfDrillList";

/** Two breakdowns under a store. Items are not one of them — they live
 *  inside a sub department, and a tab for them showed the department list a
 *  second time under a name that promised item rows. */
const DETAIL_TABS: DetailTab<"subs" | "hours">[] = [
  { key: "subs", label: "Sub Depts" },
  { key: "hours", label: "Hours" },
];

const STORE_SORTS: SortOption<PairSort>[] = [
  { key: "sales", label: "Sales" },
  { key: "change", label: "Change vs LY" },
  { key: "name", label: "Store #" },
];

/** Stores sort on their number, taken from the key — the label is whatever
 *  name the user knows the store by, which needn't start with it. */
const storeNumberOf = (p: { key: string; label: string }) =>
  p.key.split("__")[1] ?? p.label;

/**
 * Weekly Sales on mobile.
 *
 * The screen is one list of stores, and a store is a card that opens where it
 * sits. Collapsed, a card carries only what the group `sales/weekly` already
 * returned — name, paired bars, change — so a group of any size lists without
 * a single extra request. Expanding one fetches that store's sub-department
 * and hourly rows once and keeps them, so re-opening it is free.
 *
 * One card at a time. The open card is a full report; leaving its neighbours
 * at full height means the thing you opened is never on screen by itself, so
 * they give up their bars while it is open.
 *
 * There are no Stores / Subs / Hours tabs. A breakdown belongs to a store, and
 * tabs above the list made that a mode you had to set rather than a place you
 * went — you picked a store on one tab to change what a different tab showed.
 * Now the drill is inside the card whose figures it explains.
 *
 * No severity, no thresholds, no last week. This year sits against last year
 * and the reader draws the conclusion — which is how the legacy mobile view
 * worked, and why it never read as technical.
 */
const SalesPerfMobile = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const perf = useAppSelector((s) => s.dev.salesPerf);
  const { assignedStores, selectedGroupStores } = useAppSelector((s) => s.user);

  /** Narrows a long group list. Ephemeral by design — it describes what you
   *  are looking for right now, not what the search returned. */
  const [storeFilter, setStoreFilter] = useState("");

  const scroller = useRef<HTMLDivElement>(null);
  const openCard = useRef<HTMLDivElement>(null);
  /** Where the store list was left. The list unmounts while the detail view is
   *  up, so the position has to survive outside the DOM. */
  const listScroll = useRef(0);

  /** The name the user knows a store by, never the one the payload sent.
   *  Group searches can include stores nobody is personally assigned to, which
   *  is what `selectedGroupStores` covers. */
  const nameOf = (storeid: number, fallback?: string) =>
    resolveStoreName(assignedStores, selectedGroupStores, storeid, fallback);

  const isStore = !isGroupSearch(search.type);
  const useGroups = isStore ? 0 : 1;
  const searchValue = isStore ? search.lastStore : search.lastGroup;
  const singleStore = isStore ? 1 : 0;

  /** The seven days of the selected week, and their day-matched partners last
   *  year. Shifting only the two endpoints breaks when one lands on a
   *  fixed-date holiday: that end snaps to the holiday while the other keeps a
   *  weekday shift, and the range stops lining up with the per-day lookups. */
  // singleDate is m/d/yyyy off formatDate; Goliath wants yyyy-mm-dd. Passing
  // the raw picker value returns an empty result rather than an error.
  const twEnd = formatGoliathDate(search.singleDate);
  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  const lyDates = Array.from(
    { length: 7 },
    (_, i) =>
      sameWeekDayLastYear(addDays(twStart, i).toISOString().split("T")[0]).date,
  ).sort();

  /** Sub-department and hourly rows for one scope, both periods. */
  const fetchBundle = async (
    grouped: number,
    value: number,
    single: number,
  ): Promise<PerfBundle> => {
    const args = [grouped, value, single] as const;
    const [hTy, hLy, sTy, sLy] = await Promise.all([
      getHourly(context.url, context.token, twStart, twEnd, ...args),
      getHourly(context.url, context.token, lyDates[0], lyDates[6], ...args),
      getSubs(context.url, context.token, twStart, twEnd, ...args),
      getSubs(context.url, context.token, lyDates[0], lyDates[6], ...args),
    ]);
    // getHourly and getSubs both answer on `.subs`, not `.sales`.
    return {
      hourlyTy: hTy.data.error === 0 ? hTy.data.subs : [],
      hourlyLy: hLy.data.error === 0 ? hLy.data.subs : [],
      subsTy: sTy.data.error === 0 ? sTy.data.subs : [],
      subsLy: sLy.data.error === 0 ? sLy.data.subs : [],
    };
  };

  const fetchPerf = async () => {
    dispatch(setPerfLoading(true));
    // Every cached store bundle belongs to the old date range.
    dispatch(clearPerfStoreCache());
    try {
      const args = [useGroups, searchValue, singleStore] as const;
      const [wTy, wLy, bundle] = await Promise.all([
        getWeekly(context.url, context.token, twStart, twEnd, ...args),
        getWeekly(context.url, context.token, lyDates[0], lyDates[6], ...args),
        // A group search no longer loads a group-wide breakdown: there is
        // nowhere on screen to show one now that Subs and Hours live inside a
        // store card, and each card fetches its own on the way open. A single
        // store still needs one up front, because its one card opens with the
        // screen. That takes a group search from six calls to two.
        isStore
          ? fetchBundle(useGroups, searchValue, singleStore)
          : Promise.resolve(emptyBundle()),
      ]);

      dispatch(
        setPerfWeek({
          ty: wTy.data.error === 0 ? wTy.data.sales : [],
          ly: wLy.data.error === 0 ? wLy.data.sales : [],
        }),
      );
      dispatch(setPerfGroupData(bundle));
      dispatch(setPerfHasSearched(true));
    } catch (err) {
      toast.error("Error loading sales: " + (err as JsonError).message);
    } finally {
      dispatch(setPerfLoading(false));
    }
  };

  /**
   * Fetch a store's bundle the first time its card is expanded, and only then.
   *
   * A group response carries no store dimension, so a store's own Subs and
   * Hours mean asking for that store specifically. Cached by key, so
   * re-opening a card costs nothing — each store is one round of calls per
   * search, however often it is tapped.
   */
  useEffect(() => {
    const key = perf.selectedStore;
    if (!key || perf.storeData[key] || perf.storeLoading === key) return;

    // The group's own breakdown is fetched the same way and cached in the same
    // map — it is just a different scope to ask the endpoints for.
    const row =
      key === GROUP_KEY
        ? null
        : perf.weekTy.find((r) => storeKeyOf(r) === key);
    if (key !== GROUP_KEY && !row) return;

    const gen = perf.storeCacheGen;
    dispatch(setPerfStoreLoading(key));
    // Always cached under its own key, even if the user has moved on: the rows
    // are still that store's, and dropping them used to strand the loading
    // flag — collapse a card before it landed and re-opening it never fetched
    // again, so Transactions, Avg basket and Coupons sat at zero. The slice
    // discards a result from an older search.
    (key === GROUP_KEY
      ? fetchBundle(useGroups, searchValue, singleStore)
      : fetchBundle(0, row!.storeid, 1)
    )
      .then((bundle) => dispatch(cachePerfStoreData({ key, bundle, gen })))
      .catch((err: JsonError) => {
        dispatch(failPerfStoreData(key));
        toast.error("Error loading store: " + err.message);
      });
  }, [perf.selectedStore]);

  /**
   * The group's day scopes the whole list; a store card's scopes only itself.
   *
   * A store card opens on the group's day and can override it, which is what
   * the fallback below says. Deferred because rebuilding the list and the open
   * report is synchronous — a tap has to register before that work starts, and
   * the chart's own highlight reads the same deferred value so the column and
   * the rows it scopes move on one render.
   */
  const shownGroupDay = useDeferredValue(perf.groupDay);
  const shownDay = useDeferredValue(perf.selectedDay ?? perf.groupDay);

  const storePairs = useMemo(() => {
    // The list answers to the group card only. A day picked inside one store's
    // card used to rewrite every other store's figures, with nothing on their
    // collapsed rows to say why the numbers had moved.
    const built = buildStorePairs(
      perf.weekTy,
      perf.weekLy,
      shownGroupDay,
      nameOf,
    );
    // Unsorted is a real state, not a missing default — see `storeSort`.
    return perf.storeSort
      ? sortPairs(built, perf.storeSort.key, storeNumberOf, perf.storeSort.reversed)
      : built;
  }, [
    perf.weekTy,
    perf.weekLy,
    shownGroupDay,
    perf.storeSort,
    assignedStores,
    selectedGroupStores,
  ]);

  const openKey = isStore
    ? (storePairs[0]?.key ?? null)
    : perf.selectedStore;

  /** The group card is a card in the same accordion, so "which is open" stays
   *  one question. */
  const groupOpen = openKey === GROUP_KEY;

  /** What the open card's figures are scoped to in the weekly rows. A
   *  single-store search is already only that store, and the group card is
   *  every store, so both scope to null. */
  const scopeKey = isStore || groupOpen ? null : perf.selectedStore;

  /** The day the open card reads. The group card owns the list's day; a store
   *  card starts from it and may override it. */
  const cardDay = groupOpen ? shownGroupDay : shownDay;

  /** The open card's bundle. A single-store search keeps its one bundle in
   *  groupData, because that IS the store's; everything else, the group
   *  included, is fetched on expand and cached under its own key. */
  const active: PerfBundle = isStore
    ? perf.groupData
    : openKey
      ? (perf.storeData[openKey] ?? emptyBundle())
      : emptyBundle();

  const bundleLoading = openKey !== null && !isStore && !perf.storeData[openKey];

  const visibleStores = useMemo(() => {
    const q = storeFilter.trim().toLowerCase();
    if (!q) return storePairs;
    return storePairs.filter(
      (p) => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q),
    );
  }, [storePairs, storeFilter]);

  /** Items belong to one store, so the endpoint is asked for that store and
   *  the rows are narrowed to its number when an id carries two. */
  const itemScope: {
    key: string;
    storeid: number;
    storeNumber: string | null;
  } | null = isStore
    ? { key: `store:${searchValue}`, storeid: searchValue, storeNumber: null }
    : groupOpen
      ? null
      : (() => {
        const row = openKey
          ? perf.weekTy.find((r) => storeKeyOf(r) === openKey)
          : undefined;
        if (!row) return null;
        // Only narrow by number when this id really carries two stores — the
        // endpoints don't promise to format store_number the same way.
        const shared = perf.weekTy.some(
          (r) => r.storeid === row.storeid && r.store_number !== row.store_number,
        );
        return {
          key: storeKeyOf(row),
          storeid: row.storeid,
          storeNumber: shared ? row.store_number : null,
        };
      })();

  const itemKey =
    itemScope && perf.openSubDept
      ? `${itemScope.key}|${perf.openSubDept.id}`
      : null;

  /**
   * One sub department's items, fetched the first time it is opened for a
   * store and kept for the search — the same contract as the store bundle.
   *
   * One department per request. Every way into items names the department, so
   * asking `subs/subs` for all of them would fetch twenty to show one, and
   * hold the other nineteen to save a tap most readers never make.
   */
  useEffect(() => {
    if (!itemKey || !itemScope || !perf.openSubDept) return;
    if (perf.itemData[itemKey] || perf.itemLoading === itemKey) return;

    const key = itemKey;
    const { storeid, storeNumber } = itemScope;
    const subId = perf.openSubDept.id;
    const gen = perf.storeCacheGen;
    const scoped = (rows: SubDeptMargin[]) =>
      withProductCode(rows).filter(
        (r) =>
          storeNumber === null ||
          String(r.store_number).trim().replace(/^0+/, "") ===
            storeNumber.trim().replace(/^0+/, ""),
      );

    dispatch(setPerfItemLoading(key));
    Promise.all([
      fetchSubDeptRows(context.url, context.token, subId, twStart, twEnd, 0, storeid, 1),
      // Last year resolves empty rather than throwing. A store with no history
      // for this department answers the LY window with an error, and letting
      // that reject the pair put the whole list on "Error loading items" while
      // this year's rows were sitting right there.
      fetchSubDeptRowsSafe(
        context.url,
        context.token,
        subId,
        lyDates[0],
        lyDates[6],
        0,
        storeid,
        1,
      ),
    ])
      .then(([ty, ly]) =>
        dispatch(
          cachePerfItems({ key, items: { ty: scoped(ty), ly: scoped(ly) }, gen }),
        ),
      )
      .catch((err: JsonError) => {
        dispatch(failPerfItems(key));
        toast.error("Error loading items: " + err.message);
      });
  }, [itemKey]);

  const openItems = itemKey ? perf.itemData[itemKey] : undefined;
  const itemsLoading = itemKey !== null && !openItems;

  /**
   * Opening a card brings it to the top of the screen.
   *
   * An accordion has to scroll DOWN as well as up: the card you just tapped is
   * usually below the one that was open, and leaving the viewport where it was
   * means the report you asked for opens off screen. This is why the screen
   * doesn't use `useDrillScroll` — that hook only ever scrolls up on a move
   * within a level, which is right for tabs and wrong for this.
   *
   * A layout effect so the old position never paints, and it reads the card's
   * box after the commit, when its neighbours have already given up their bars
   * and the list above it has finished shrinking.
   */
  useLayoutEffect(() => {
    if (perf.detailOpen || !openKey) return;
    const el = scroller.current;
    const card = openCard.current;
    if (!el || !card) return;
    const offset =
      card.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.scrollTop = Math.max(0, el.scrollTop + offset - 8);
  }, [openKey]);

  /** Coming back from the detail view lands where the list was left, not at
   *  the top of it. */
  useLayoutEffect(() => {
    if (perf.detailOpen) return;
    const el = scroller.current;
    if (el) el.scrollTop = listScroll.current;
  }, [perf.detailOpen]);

  const days = useMemo(
    () => buildDays(perf.weekTy, perf.weekLy, scopeKey),
    [perf.weekTy, perf.weekLy, scopeKey],
  );

  const totals = useMemo(
    () =>
      buildTotals(
        perf.weekTy,
        perf.weekLy,
        active.hourlyTy,
        active.subsTy,
        cardDay,
        scopeKey,
      ),
    [perf.weekTy, perf.weekLy, active, cardDay, scopeKey],
  );

  /** The whole week's day matching for the open card's store. */
  const weekMatch = useMemo(
    () => scopeMatch(perf.weekTy, perf.weekLy, scopeKey),
    [perf.weekTy, perf.weekLy, scopeKey],
  );

  /** The group's own total, always the full week — a fixed reference the card
   *  figures can be read against, so scoping one card to a day doesn't move
   *  the number above it. */
  const groupTotals = useMemo(
    () => buildTotals(perf.weekTy, perf.weekLy, [], [], null, null),
    [perf.weekTy, perf.weekLy],
  );
  const groupMatch = useMemo(
    () => scopeMatch(perf.weekTy, perf.weekLy, null),
    [perf.weekTy, perf.weekLy],
  );

  const drillDim: "subs" | "hours" = perf.drill === "hours" ? "hours" : "subs";
  const drillSort = perf.sort[drillDim];
  const drillPairs = useMemo(() => {
    const rows =
      perf.drill === "subs"
        ? buildSubPairs(active.subsTy, active.subsLy, cardDay, weekMatch)
        : perf.drill === "hours"
          ? buildHourPairs(active.hourlyTy, active.hourlyLy, cardDay, weekMatch)
          : [];
    // No chip pressed means the order the list was built in — size for sub
    // departments, time for hours.
    return drillSort
      ? sortPairs(rows, drillSort.key, undefined, drillSort.reversed)
      : rows;
  }, [perf.drill, drillSort, cardDay, active, weekMatch]);

  const itemMatch = useMemo(
    () => (itemScope ? scopeMatch(perf.weekTy, perf.weekLy, scopeKey) : undefined),
    [perf.weekTy, perf.weekLy, scopeKey, itemScope?.key],
  );

  const allItemPairs = useMemo(() => {
    if (!openItems) return [];
    const rows = buildItemPairs(openItems.ty, openItems.ly, cardDay, itemMatch);
    return perf.itemSort
      ? sortPairs(rows, perf.itemSort.key, undefined, perf.itemSort.reversed)
      : rows;
  }, [openItems, cardDay, perf.itemSort, itemMatch]);
  const itemPairs = useMemo(
    () => filterItemPairs(allItemPairs, perf.itemQuery),
    [allItemPairs, perf.itemQuery],
  );
  const listMax = storePairs.reduce((m, p) => Math.max(m, p.ty, p.ly), 0);

  const totalsPartial = isPartialMatch({
    days: totals.days ?? undefined,
    lyDays: totals.lyDays ?? undefined,
  });
  const listPartial = !cardDay && isPartialMatch(weekMatch);
  /** Nothing on file last year for the open card's scope — drawn as "no
   *  history", not a $0.00 bar. */
  const cardNoLy = noLyHistory(weekMatch, cardDay);

  /** storeid alone is not unique — some ids carry two store numbers — so the
   *  set keys on both or two real stores would count as one. */
  const storeCount = new Set(
    perf.weekTy.map((r) => `${r.storeid}__${r.store_number}`),
  ).size;

  const dayLabel = cardDay
    ? new Date(`${cardDay}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "numeric",
        day: "numeric",
      })
    : null;
  const whenLabel =
    dayLabel ?? `${formatDateSimple(twStart)} – ${formatDateSimple(twEnd)}`;

  const scopeName = isGroupSearch(search.type)
    ? search.selectedGroup.group_name
    : nameOf(search.lastStore, perf.weekTy[0]?.store_name);

  /** What the open card is about, for the detail view's header. */
  const openStoreName = groupOpen
    ? scopeName
    : (storePairs.find((p) => p.key === openKey)?.label ?? "this store");

  const drillList = perf.drill ? (
    <PerfDrillList
      drill={perf.drill}
      pairs={drillPairs}
      sort={drillSort?.key ?? null}
      sortDir={drillSort ? dirOf(drillSort.key, drillSort.reversed) : null}
      onSort={(key) => dispatch(setPerfSort({ dimension: drillDim, sort: key }))}
      listPartial={listPartial}
      listNote={matchedNote(weekMatch)}
      shownDay={cardDay}
      loading={bundleLoading}
      allowItems={itemScope !== null}
      storeName={openStoreName}
      openSubDept={perf.openSubDept}
      onOpenSubDept={(v) => dispatch(openPerfSubDept(v))}
      items={{
        pairs: itemPairs,
        total: allItemPairs.length,
        loading: itemsLoading,
        sort: perf.itemSort?.key ?? null,
        sortDir: perf.itemSort
          ? dirOf(perf.itemSort.key, perf.itemSort.reversed)
          : null,
        onSort: (key) => dispatch(setPerfItemSort(key)),
        query: perf.itemQuery,
        onQuery: (q) => dispatch(setPerfItemQuery(q)),
        partial: itemMatch ? isPartialMatch(itemMatch) : false,
        note: itemMatch ? matchedNote(itemMatch) : "",
      }}
    />
  ) : null;

  // hasSearched false means "show me the search card" — either the first visit
  // or a deliberate return via the range chip. The second clause covers a
  // search that came back empty.
  if (!perf.hasSearched || (!perf.loading && perf.weekTy.length === 0)) {
    return (
      <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden">
        <SearchCard
          top
          title="Weekly Sales"
          description="Select a store or group and end date."
          buttonLabel="Load sales"
          singleDate
          onSearch={fetchPerf}
          loading={perf.loading}
          loadingMessage="Finding sales..."
          onBack={
            // Only offered when there is something to go back TO. Landing here
            // for the first time has no results behind it.
            perf.weekTy.length > 0
              ? () => dispatch(setPerfHasSearched(true))
              : undefined
          }
          backLabel="Back to sales"
          notice={
            perf.hasSearched
              ? "No data found for that search — try a different store, group, or week."
              : undefined
          }
        />
      </div>
    );
  }


  // A breakdown is its own screen. The card that sent us here stays open
  // behind it, so Back is a return rather than a re-search.
  if (perf.detailOpen && perf.drill && openKey) {
    return (
      <MobilePerfDetail
        tabs={DETAIL_TABS}
        active={perf.drill}
        onTab={(k) => dispatch(setPerfDrill(k))}
        scopeName={openStoreName}
        when={whenLabel}
        backLabel="Stores"
        onBack={() => dispatch(openPerfDetail(false))}
        levelKey={`${perf.drill}|${perf.openSubDept?.id ?? ""}`}
      >
        {drillList}
      </MobilePerfDetail>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow
          and would otherwise hide the last card. */}
      <div
        ref={scroller}
        onScroll={(e) => (listScroll.current = e.currentTarget.scrollTop)}
        className="flex-1 overflow-y-auto pb-14"
      >
        <div className="flex flex-col gap-3 p-3">
          {/* ── the group: the search, and a card like any other ──── */}
          {/* It opens and closes in the same accordion as the stores, so
              expanding it collapses whichever store was open and vice versa.
              Its day chart is the list's scope rather than its own: the stores
              below answer to it until it is cleared.

              Skipped entirely on a single-store search — there is no group and
              no list, so that page's one card carries the search and ? itself
              rather than having the store's name printed above it twice. */}
          {isGroupSearch(search.type) && (
            <section
              ref={groupOpen ? openCard : undefined}
              className={`overflow-hidden rounded-2xl border bg-custom-white shadow-md transition-colors ${
                groupOpen ? "border-gray-300" : "border-gray-200"
              }`}
            >
              <PerfCardHeader
                title={scopeName}
                // Only on a group. "Single store" beside a store's own name was
                // saying the same thing twice.
                note={`${storeCount} ${storeCount === 1 ? "store" : "stores"}`}
                label=""
                when={`${formatDateSimple(twStart)} – ${formatDateSimple(twEnd)}`}
                onSearch={() => dispatch(setPerfHasSearched(false))}
                onInfo={() => dispatch(setPerfInfoOpen(true))}
                onToggle={() => dispatch(togglePerfStore(GROUP_KEY))}
                open={groupOpen}
              />

              {/* Collapsed, it is the whole-group answer — and it stays on screen
                  while a store card is open, because that is when it is most
                  use: a store figure means little without the total it is part
                  of. Store cards minimise for each other because they compete
                  for the same attention; the group total is the denominator, not
                  a peer. */}
              {!groupOpen && (
                <div className="px-3.5 pb-3.5 pt-1.5">
                  <div className="font-display text-[24px] font-extrabold leading-none tracking-tight text-content">
                    {formatCurrency2(groupTotals.sales)}
                  </div>
                  <div className="mt-2.5">
                    <PairedBars
                      ty={groupTotals.sales}
                      ly={groupTotals.salesLy}
                      max={Math.max(groupTotals.sales, groupTotals.salesLy)}
                      compact
                      lyUnavailable={noLyHistory(groupMatch, null)}
                    />
                  </div>
                </div>
              )}

              {groupOpen && (
                <PerfStoreReport
                  days={days}
                  selectedDay={shownGroupDay}
                  onToggleDay={(iso) => dispatch(togglePerfGroupDay(iso))}
                  noLy={cardNoLy}
                  totals={totals}
                  bundleLoading={bundleLoading}
                  totalsPartial={totalsPartial}
                  totalsNote={matchedNote(totals)}
                  onViewDetails={() => dispatch(openPerfDetail(true))}
                />
              )}
            </section>
          )}

          {/* ── how the list is ordered and narrowed ─────────────── */}
          {isGroupSearch(search.type) && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
              <MobileSortChips
                options={STORE_SORTS}
                value={perf.storeSort?.key ?? null}
                dir={
                  perf.storeSort
                    ? dirOf(perf.storeSort.key, perf.storeSort.reversed)
                    : null
                }
                onChange={(key) => dispatch(setPerfStoreSort(key))}
              />
              <div className="px-3.5 py-2">
                <div className="flex items-center gap-2 rounded-lg bg-bkg px-3">
                  <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/85" />
                  <input
                    id="perf-store-filter"
                    value={storeFilter}
                    onChange={(e) => setStoreFilter(e.target.value)}
                    placeholder="Filter by store"
                    inputMode="search"
                    enterKeyHint="search"
                    aria-label="Filter by store"
                    className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14px] text-content placeholder:text-content/85"
                    style={{
                      outline: "none",
                      WebkitAppearance: "none",
                      boxShadow: "none",
                    }}
                  />
                  {storeFilter && (
                    <button
                      type="button"
                      onClick={() => setStoreFilter("")}
                      aria-label="Clear filter"
                      className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/85 active:bg-custom-white"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── the stores ──────────────────────────────────────── */}
          {visibleStores.length === 0 ? (
            <section className="rounded-2xl border border-gray-200 bg-custom-white px-4 py-8 text-center text-[12.5px] text-content/85 shadow-md">
              {storeFilter.trim()
                ? `No store matches "${storeFilter.trim()}".`
                : "Nothing recorded for this week."}
            </section>
          ) : (
            visibleStores.map((p) => {
              const isOpen = p.key === openKey;
              const change = pairChangePct(p);
              return (
                <div key={p.key} ref={isOpen ? openCard : undefined}>
                  <MobilePerfCard
                    label={p.label}
                    change={change === null ? "—" : fmtChange(change)}
                    flagged={isPartialMatch(p)}
                    flagNote={matchedNote(p)}
                    bars={
                      <PairedBars
                        ty={p.ty}
                        ly={p.ly}
                        max={listMax}
                        lyUnavailable={p.noLy}
                      />
                    }
                    open={isOpen}
                    minimised={!isOpen && openKey !== null}
                    // A single-store search has one card and nothing to
                    // collapse it to, so it has no control.
                    onToggle={
                      isStore
                        ? undefined
                        : () => dispatch(togglePerfStore(p.key))
                    }
                    // Single store: this card is the page, so it carries the
                    // week and the page's own controls.
                    when={
                      isStore
                        ? `${formatDateSimple(twStart)} – ${formatDateSimple(twEnd)}`
                        : undefined
                    }
                    onSearch={
                      isStore
                        ? () => dispatch(setPerfHasSearched(false))
                        : undefined
                    }
                    onInfo={
                      isStore ? () => dispatch(setPerfInfoOpen(true)) : undefined
                    }
                  >
                    {isOpen && (
                      <PerfStoreReport
                        days={days}
                        selectedDay={shownDay}
                        onToggleDay={(iso) => dispatch(togglePerfDay(iso))}
                        noLy={cardNoLy}
                        totals={totals}
                        bundleLoading={bundleLoading}
                        totalsPartial={totalsPartial}
                        totalsNote={matchedNote(totals)}
                        onViewDetails={() => dispatch(openPerfDetail(true))}
                      />
                    )}
                  </MobilePerfCard>
                </div>
              );
            })
          )}
        </div>
      </div>

      <InfoModal
        page="sales"
        isOpen={perf.infoOpen}
        onClose={() => dispatch(setPerfInfoOpen(false))}
      />
    </div>
  );
};

export default SalesPerfMobile;
