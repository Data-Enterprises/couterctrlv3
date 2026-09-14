import { useDeferredValue, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import SearchCard from "../../../../components/SearchCard";
import { getHourly, getSubs, getWeekly } from "../../../../api/sales";
import { fetchSubDeptRows } from "../../../../utils/marginRows";
import { withProductCode } from "../../shared/ledgerUtils";
import { SALES_MOBILE_INFO } from "../../salesInfo";
import MobileInfoSheet from "../../../../components/mobile/MobileInfoSheet";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  addDays,
  formatCurrency2,
  formatDateSimple,
  formatGoliathDate,
  sameWeekDayLastYear,
} from "../../../../utils";
import { isGroupSearch } from "../../../../features/searchSlice";
import { resolveStoreName } from "../../../../utils";
import type { JsonError, SubDeptMargin } from "../../../../interfaces";
import {
  cachePerfItems,
  cachePerfStoreData,
  clearPerfStoreCache,
  failPerfItems,
  openPerfSubDept,
  setPerfInfoOpen,
  setPerfItemLoading,
  setPerfItemSort,
  failPerfStoreData,
  emptyBundle,
  setPerfDimension,
  setPerfGroupData,
  setPerfSort,
  setPerfHasSearched,
  setPerfLoading,
  setPerfStoreLoading,
  setPerfWeek,
  togglePerfDay,
  togglePerfStore,
  type PerfBundle,
  type PerfDimension,
} from "../../../../features/salesPerfSlice";
import {
  storeKeyOf,
  buildDays,
  buildHourPairs,
  buildItemPairs,
  buildStorePairs,
  buildSubPairs,
  buildTotals,
  pairChangePct,
  sortPairs,
  type PairSort,
} from "./perfData";
import MobileSortChips, {
  type SortOption,
} from "../../../../components/mobile/MobileSortChips";
import PairedBars from "./PairedBars";
import { COUPON_COLORS, COUPON_LABELS, LY_COLOR, TY_COLOR } from "./perfColors";
import PerfDayChart from "./PerfDayChart";
import PerfCardHeader from "./PerfCardHeader";

/** Darkest to lightest, so the stack and the legend agree. */
const COUPON_KEYS = ["digital", "elecStore", "elecInstore", "store"] as const;

/** What each tab can sort by. Hours adds the time of day, which is also its
 *  default — a day reads as a timeline first. */
const SORTS: Record<PerfDimension, SortOption<PairSort>[]> = {
  stores: [
    { key: "sales", label: "Sales" },
    { key: "change", label: "Change vs LY" },
    { key: "name", label: "Store #" },
  ],
  subs: [
    { key: "sales", label: "Sales" },
    { key: "change", label: "Change vs LY" },
    { key: "name", label: "Name" },
  ],
  hours: [
    { key: "time", label: "Time" },
    { key: "sales", label: "Sales" },
    { key: "change", label: "Change vs LY" },
  ],
};

/** Stores sort on their number, taken from the key — the label is whatever
 *  name the user knows the store by, which needn't start with it. */
const storeNumberOf = (p: { key: string; label: string }) =>
  p.key.split("__")[1] ?? p.label;

const fmtChange = (pct: number) =>
  `${pct > 0 ? "+" : pct < 0 ? "\u2212" : ""}${Math.abs(pct).toFixed(1)}%`;

const ITEM_SORTS: SortOption<PairSort>[] = [
  { key: "sales", label: "Sales" },
  { key: "change", label: "Change vs LY" },
  { key: "name", label: "Name" },
];

const DIMENSIONS: { key: PerfDimension; label: string }[] = [
  { key: "stores", label: "Stores" },
  { key: "subs", label: "Subs" },
  { key: "hours", label: "Hours" },
];

/**
 * Weekly Sales on mobile, without grading.
 *
 * Stores, Subs and Hours are tabs above the scroll — the same position every
 * other mobile Performance page puts its views. Under them sit three cards:
 * the period total, the week as tappable columns, and one breakdown list. The
 * tab changes only that last list, so nothing has to be relearned moving
 * between them.
 *
 * Selecting a store on the Stores tab is a filter rather than a drill: it
 * narrows Subs and Hours to that store and the same tap clears it. That is why
 * there is no back control here, unlike the pages whose rows navigate.
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
  const perf = useAppSelector((s) => s.salesPerf);
  const { assignedStores, selectedGroupStores } = useAppSelector((s) => s.user);

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

  /** Sub-department and hourly rows for one scope, both periods.
   *
   *  `useGroups` and `singleStore` decide the scope: the group as searched, or
   *  one store. Split out because it runs twice — once for the group on
   *  search, and once per store the moment someone selects one. */
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
        fetchBundle(useGroups, searchValue, singleStore),
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
   * Fetch a store's bundle the first time it is selected, and only then.
   *
   * A group response carries no store dimension, so narrowing Subs or Hours to
   * one store means asking for that store specifically. Cached by key, so
   * revisiting a store costs nothing and returning to all stores costs
   * nothing — each store is one round of calls per search, however often it is
   * tapped.
   */
  useEffect(() => {
    const key = perf.selectedStore;
    if (!key || perf.storeData[key] || perf.storeLoading === key) return;

    const row = perf.weekTy.find((r) => storeKeyOf(r) === key);
    if (!row) return;

    const gen = perf.storeCacheGen;
    dispatch(setPerfStoreLoading(key));
    // Always cached under its own key, even if the user has moved on: the rows
    // are still that store's, and dropping them used to strand the loading
    // flag — deselect a store before it landed and re-tapping it never fetched
    // again, so Transactions, Avg basket and Coupons sat at zero. The slice
    // discards a result from an older search.
    fetchBundle(0, row.storeid, 1)
      .then((bundle) => dispatch(cachePerfStoreData({ key, bundle, gen })))
      .catch((err: JsonError) => {
        dispatch(failPerfStoreData(key));
        toast.error("Error loading store: " + err.message);
      });
  }, [perf.selectedStore]);

  /**
   * The one store items can be shown for, or null.
   *
   * Items are fetched per store, as on desktop: a single-store search is that
   * store; a group search needs a store picked on the Stores tab. The store
   * number is kept because storeid alone isn't unique — the endpoint answers
   * for the id, so rows are narrowed to the number too.
   */
  const itemScope: { key: string; storeid: number; storeNumber: string | null } | null =
    isStore
      ? { key: `store:${searchValue}`, storeid: searchValue, storeNumber: null }
      : (() => {
          const row = perf.selectedStore
            ? perf.weekTy.find((r) => storeKeyOf(r) === perf.selectedStore)
            : undefined;
          if (!row) return null;
          // Only narrow by number when this id really carries two stores —
          // the endpoints don't promise to format store_number the same way.
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
    itemScope && perf.openSubDept ? `${itemScope.key}|${perf.openSubDept.id}` : null;

  /** A sub department's items, fetched the first time it's opened for a store
   *  and kept for the search — the same contract as the store bundle above. */
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
      fetchSubDeptRows(context.url, context.token, subId, lyDates[0], lyDates[6], 0, storeid, 1),
    ])
      .then(([ty, ly]) =>
        dispatch(cachePerfItems({ key, items: { ty: scoped(ty), ly: scoped(ly) }, gen })),
      )
      .catch((err: JsonError) => {
        dispatch(failPerfItems(key));
        toast.error("Error loading items: " + err.message);
      });
  }, [itemKey]);

  const openItems = itemKey ? perf.itemData[itemKey] : undefined;
  const itemsLoading = itemKey !== null && !openItems;

  /** The group bundle, or the selected store's. Never a filter over the group
   *  bundle — those rows do not say which store they came from. */
  const active: PerfBundle = perf.selectedStore
    ? (perf.storeData[perf.selectedStore] ?? emptyBundle())
    : perf.groupData;

  const bundleLoading =
    perf.selectedStore !== null && !perf.storeData[perf.selectedStore];

  /**
   * The day the screen is scoped to, held one render behind.
   *
   * Rebuilding the totals and the breakdown is synchronous, so a tap blocked
   * the main thread until both were done and then repainted everything at
   * once. Deferring it lets the tap register first — and because the chart's
   * own highlight reads this same deferred value, the column and the rows it
   * scopes always move on the same render rather than one leading the other.
   */
  const shownDay = useDeferredValue(perf.selectedDay);

  const days = useMemo(
    () => buildDays(perf.weekTy, perf.weekLy, perf.selectedStore),
    [perf.weekTy, perf.weekLy, perf.selectedStore],
  );

  const totals = useMemo(
    () =>
      buildTotals(
        perf.weekTy,
        perf.weekLy,
        active.hourlyTy,
        active.subsTy,
        shownDay,
        perf.selectedStore,
      ),
    [perf.weekTy, perf.weekLy, active, shownDay, perf.selectedStore],
  );

  const sort = perf.sort[perf.dimension];
  const pairs = useMemo(() => {
    if (perf.dimension === "subs")
      return sortPairs(
        buildSubPairs(active.subsTy, active.subsLy, shownDay),
        sort,
      );
    if (perf.dimension === "hours")
      return sortPairs(
        buildHourPairs(active.hourlyTy, active.hourlyLy, shownDay),
        sort,
      );
    return sortPairs(
      buildStorePairs(perf.weekTy, perf.weekLy, shownDay, nameOf),
      sort,
      storeNumberOf,
    );
  }, [
    perf.dimension,
    sort,
    shownDay,
    perf.weekTy,
    perf.weekLy,
    active,
    assignedStores,
    selectedGroupStores,
  ]);

  /** One scale across the whole list, so a row's bar length means the same
   *  thing in every row. */
  const listMax = pairs.reduce((m, p) => Math.max(m, p.ty, p.ly), 0);

  const itemPairs = useMemo(
    () =>
      openItems
        ? sortPairs(buildItemPairs(openItems.ty, openItems.ly, shownDay), perf.itemSort)
        : [],
    [openItems, shownDay, perf.itemSort],
  );
  const itemMax = itemPairs.reduce((m, p) => Math.max(m, p.ty, p.ly), 0);
  const showingItems = perf.dimension === "subs" && perf.openSubDept !== null;

  const dayLabel = shownDay
    ? new Date(`${shownDay}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "numeric",
        day: "numeric",
      })
    : null;

  /** storeid alone is not unique — some ids carry two store numbers — so
   *  the set keys on both or two real stores would count as one. */
  const storeCount = new Set(
    perf.weekTy.map((r) => `${r.storeid}__${r.store_number}`),
  ).size;

  /** The big label names every active scope, in the order they narrow:
   *  measure, then store, then day. Without it a filtered figure looks like a
   *  wrong one. */
  const selectedStoreName = perf.selectedStore
    ? (() => {
        const row = perf.weekTy.find(
          (r) => storeKeyOf(r) === perf.selectedStore,
        );
        return row ? nameOf(row.storeid, row.store_name) : null;
      })()
    : null;

  const scopeLabel = selectedStoreName ?? "";

  const scopeName = isGroupSearch(search.type)
    ? search.selectedGroup.group_name
    : nameOf(search.lastStore, perf.weekTy[0]?.store_name);

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

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* Stores / Subs / Hours sit above the scroll, directly under the app
          header, matching every other mobile Performance page. Inside the list
          card they read as a filter on that card; up here they read as where
          you are — which is what they are, since the totals and the week chart
          answer to them too. */}
      <nav className="flex flex-shrink-0 border-b border-gray-200 bg-custom-white">
        {DIMENSIONS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => dispatch(setPerfDimension(d.key))}
            aria-current={perf.dimension === d.key ? "page" : undefined}
            className={`flex-1 border-r border-gray-100 py-3 text-[12.5px] font-semibold last:border-r-0 ${
              perf.dimension === d.key ? "text-content" : "text-content/85"
            }`}
            style={
              perf.dimension === d.key
                ? { boxShadow: `inset 0 -2px 0 ${TY_COLOR}` }
                : undefined
            }
          >
            {d.label}
          </button>
        ))}
      </nav>

      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow
          and would otherwise hide the last row of the list. */}
      <div className="flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-3 p-3">
          {/* ── totals ───────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            <PerfCardHeader
              title={scopeName}
              // Only on a group. "Single store" beside a store's own name was
              // saying the same thing twice.
              note={
                isGroupSearch(search.type)
                  ? `${storeCount} ${storeCount === 1 ? "store" : "stores"}`
                  : undefined
              }
              label={scopeLabel}
              when={
                dayLabel ||
                `${formatDateSimple(twStart)} – ${formatDateSimple(twEnd)}`
              }
              onSearch={() => dispatch(setPerfHasSearched(false))}
              onInfo={() => dispatch(setPerfInfoOpen(true))}
            />

            <div className="px-4 pb-4 pt-2">
              <div className="mt-1.5 font-display text-[32px] font-extrabold leading-none tracking-tight tabular-nums text-content">
                {formatCurrency2(totals.sales)}
              </div>

              <div className="mt-3">
                <PairedBars
                  ty={totals.sales}
                  ly={totals.salesLy}
                  max={Math.max(totals.sales, totals.salesLy)}
                  compact
                />
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-3">
                {/* Tax is on the weekly rows already loaded. The other three
                    come from the store's own fetch, so until it lands they
                    show a placeholder — not a zero nobody measured. */}
                {(
                  [
                    ["Transactions", totals.transactions.toLocaleString("en-US"), true],
                    ["Avg basket", formatCurrency2(totals.avgBasket), true],
                    ["Tax", formatCurrency2(totals.tax), false],
                    ["Coupons", formatCurrency2(totals.coupons), true],
                  ] as const
                ).map(([k, v, fromBundle]) => (
                  <div key={k} className="flex flex-col">
                    <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                      {k}
                    </span>
                    {fromBundle && bundleLoading ? (
                      <span
                        aria-label="Loading"
                        className="mt-1 block h-[15px] w-16 animate-pulse rounded bg-gray-200"
                      />
                    ) : (
                      <span className="font-display text-[15px] font-bold tabular-nums text-content">
                        {v}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Coupon mix. A stacked bar rather than the legacy donut: this is
                one figure split four ways, and a ring makes its own
                circumference — TY plus LY plus the rest — look like a
                quantity. Rendered even when a channel is zero, because "this
                store takes no store coupons" is itself worth seeing. */}
              {!bundleLoading && totals.coupons > 0 && (
                <div className="mt-3.5 border-t border-gray-100 pt-3">
                  <div className="flex h-2 overflow-hidden rounded-full bg-bkg">
                    {COUPON_KEYS.map((k) => (
                      <span
                        key={k}
                        style={{
                          width: `${(totals.couponSplit[k] / totals.coupons) * 100}%`,
                          background: COUPON_COLORS[k],
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {COUPON_KEYS.map((k) => (
                      <div
                        key={k}
                        className="flex items-center gap-1.5 text-[12px] tabular-nums text-content/85"
                      >
                        <span
                          className="h-2 w-2 flex-none rounded-sm"
                          style={{ background: COUPON_COLORS[k] }}
                        />
                        <span className="flex-1 truncate">
                          {COUPON_LABELS[k]}
                        </span>
                        <span className="font-semibold text-content">
                          {formatCurrency2(totals.couponSplit[k])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── the week, and the filter ─────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white px-3 pb-3 pt-3 shadow-md">
            <PerfDayChart
              days={days}
              selected={shownDay}
              onToggle={(iso) => dispatch(togglePerfDay(iso))}
            />
            <div className="mt-1 flex gap-3.5 px-1 text-[12px] text-content/85">
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
                Last year
              </span>
            </div>
            <p className="px-1 pt-1.5 text-[12px] text-content/85">
              {shownDay
                ? "Tap the selected day again for the full week."
                : "Tap a day to scope the screen to it."}
            </p>
          </section>

          {/* ── the breakdown ────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            {showingItems && perf.openSubDept ? (
              <>
                <div className="border-b border-gray-100 px-3.5 pb-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => dispatch(openPerfSubDept(null))}
                    className="-ml-1 flex items-center gap-0.5 rounded-lg py-1 pr-2 text-[12.5px] font-semibold active:bg-bkg"
                    style={{ color: TY_COLOR }}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Back to Subs
                  </button>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate font-display text-[14px] font-bold text-content">
                      {perf.openSubDept.label}
                    </span>
                    {openItems && (
                      <span className="flex-none text-[12px] text-content/85">
                        {itemPairs.length} {itemPairs.length === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>
                  {selectedStoreName && (
                    <div className="truncate text-[12px] text-content/85">
                      {selectedStoreName}
                    </div>
                  )}
                </div>
                <MobileSortChips
                  options={ITEM_SORTS}
                  value={perf.itemSort}
                  onChange={(key) => dispatch(setPerfItemSort(key))}
                />
                {itemsLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/85">
                    <span
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200"
                      style={{ borderTopColor: TY_COLOR }}
                    />
                    Loading items...
                  </div>
                ) : itemPairs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
                    No items sold {shownDay ? "on this day" : "this week or last year"}.
                  </div>
                ) : (
                  itemPairs.map((p) => {
                    const change = pairChangePct(p);
                    return (
                      <div
                        key={p.key}
                        className="border-t border-gray-100 px-3.5 py-3 first:border-t-0"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                            {p.label}
                          </span>
                          <span className="flex-none text-[12px] font-semibold tabular-nums text-content/85">
                            {change === null ? "\u2014" : fmtChange(change)}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] tracking-wider text-content/85">
                          {p.key}
                        </div>
                        <div className="mt-2">
                          <PairedBars ty={p.ty} ly={p.ly} max={itemMax} />
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            ) : (
              <>
                <MobileSortChips
                  options={SORTS[perf.dimension]}
                  value={sort}
                  onChange={(key) =>
                    dispatch(setPerfSort({ dimension: perf.dimension, sort: key }))
                  }
                />
                {perf.selectedStore && perf.dimension !== "stores" && (
                  <p className="border-b border-gray-100 px-3.5 pb-2.5 pt-3 text-[12px] text-content/85">
                    Showing {selectedStoreName} only. Clear it on the Stores tab.
                  </p>
                )}
                {perf.dimension === "subs" && !itemScope && (
                  <p className="border-b border-gray-100 px-3.5 pb-2.5 pt-3 text-[12px] text-content/85">
                    Pick a store on the Stores tab to see a sub department's items.
                  </p>
                )}

                {bundleLoading && perf.dimension !== "stores" ? (
                  <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
                    Loading {selectedStoreName}...
                  </div>
                ) : pairs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
                    Nothing recorded for this selection.
                  </div>
                ) : (
                  pairs.map((p) => {
                    // Stores select (a filter on Subs and Hours); sub
                    // departments open their items once a store is in scope.
                    // Hours stay read-only.
                    const selectsStore = perf.dimension === "stores";
                    const opensItems = perf.dimension === "subs" && itemScope !== null;
                    const tappable = selectsStore || opensItems;
                    const isSel = selectsStore && perf.selectedStore === p.key;
                    const change = pairChangePct(p);

                    return (
                      <button
                        key={p.key}
                        type="button"
                        disabled={!tappable}
                        aria-pressed={selectsStore ? isSel : undefined}
                        onClick={() => {
                          if (selectsStore) dispatch(togglePerfStore(p.key));
                          else if (opensItems)
                            dispatch(openPerfSubDept({ id: Number(p.key), label: p.label }));
                        }}
                        className={`block w-full border-t border-gray-100 px-3.5 py-3 text-left first:border-t-0 ${
                          isSel ? "bg-row_selected" : ""
                        } ${tappable ? "active:bg-bkg" : ""}`}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                            {p.label}
                          </span>
                          {/* The figure the Change sort orders on, so that order
                              can be read off the rows. Neutral: no grading on
                              mobile. A dash when last year sold nothing. */}
                          <span className="flex-none text-[12px] font-semibold tabular-nums text-content/85">
                            {change === null ? "\u2014" : fmtChange(change)}
                          </span>
                          {isSel && (
                            <span
                              className="flex-none font-mono text-[10px] uppercase tracking-wider"
                              style={{ color: TY_COLOR }}
                            >
                              Selected
                            </span>
                          )}
                          {opensItems && (
                            <ChevronRightIcon className="h-4 w-4 flex-none self-center text-content/85" />
                          )}
                        </div>
                        <div className="mt-2">
                          <PairedBars ty={p.ty} ly={p.ly} max={listMax} />
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {perf.infoOpen && (
        <MobileInfoSheet
          {...SALES_MOBILE_INFO}
          onClose={() => dispatch(setPerfInfoOpen(false))}
        />
      )}
    </div>
  );
};

export default SalesPerfMobile;
