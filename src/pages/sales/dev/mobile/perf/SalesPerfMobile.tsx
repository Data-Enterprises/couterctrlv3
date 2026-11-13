// Hooks
import { useDeferredValue, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useSalesCtx } from "../../hooks";
import {
  usePerfFetch,
  usePerfItems,
  usePerfScope,
  usePerfSearched,
  usePerfStoreBundle,
  usePerfWeek,
  useSalesPerfState,
} from "./hooks";

// Redux
import { isGroupSearch } from "../../../../../features/searchSlice";
import {
  emptyBundle,
  GROUP_KEY,
  openPerfDetail,
  openPerfSubDept,
  setPerfDrill,
  setPerfHasSearched,
  setPerfInfoOpen,
  setPerfItemQuery,
  setPerfItemSort,
  setPerfMeasure,
  setPerfSort,
  togglePerfDay,
  togglePerfGroupDay,
  togglePerfStore,
  type PerfBundle,
} from "../../../../../features/dev/devSalesPerfSlice";

// Utils
import {
  formatCurrency2,
  formatDateSimple,
  resolveStoreName,
} from "../../../../../utils";
import {
  buildDays,
  buildHourPairs,
  buildItemPairs,
  buildStorePairs,
  buildSubPairs,
  buildTotals,
  dirOf,
  filterItemPairs,
  isPartialMatch,
  matchedNote,
  noLyHistory,
  mergeLastWeek,
  fmtChange,
  gradedChangePct,
  pickFor,
  fmtUnits,
  scopeMatch,
  sortPairs,
  storeKeyOf,
  type CmpBasis,
} from "./utils/perfData";
import { DETAIL_TABS, storeNumberOf } from "./utils";

// Interfaces
import type { ItemScope } from "./interfaces";

// Components
import InfoModal from "../../../../../components-dev/InfoModal";
import PairedBars from "../../../../../components-dev/mobile/perf/PairedBars";
import PerfChange from "../../../../../components-dev/mobile/perf/PerfChange";
import PerfDelta from "../../../../../components-dev/mobile/perf/PerfDelta";
import MeasureSwitch from "../../../../../components-dev/mobile/perf/MeasureSwitch";
import PerfCardHeader from "../../../../../components-dev/mobile/perf/PerfCardHeader";
import MobilePerfCard from "../../../../../components-dev/mobile/MobilePerfCard";
import MobilePerfDetail from "../../../../../components-dev/mobile/MobilePerfDetail";
import PerfStoreReport from "./components/PerfStoreReport";
import PerfDrillList from "./components/PerfDrillList";
import PerfSearchScreen from "./components/PerfSearchScreen";
import StoreListControls from "./components/StoreListControls";

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
 * No severity and no thresholds. This year sits against last year and last
 * week, a bar each (desktop shows both, and a client asked for it on the
 * phone). The TY bar's colour and the change figure read against last year,
 * and against last week only where last year has nothing on file.
 *
 * Every figure measures sales or units, per the switch at the top: the same
 * choice desktop Sales offers. Transactions, basket, tax and coupons stay
 * money whatever it is set to.
 */
const SalesPerfMobile = () => {
  const dispatch = useAppDispatch();
  const { assignedStores, selectedGroupStores } = useSalesCtx();
  const searched = usePerfSearched();
  const perf = useSalesPerfState();

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

  const { isStore, searchValue } = usePerfScope();
  const { twStart, twEnd } = usePerfWeek();
  const { fetchBundle, fetchPerf } = usePerfFetch();

  /** Sales or units, everywhere a figure is drawn. */
  const pick = pickFor(perf.measure);
  const fmt = perf.measure === "units" ? fmtUnits : formatCurrency2;
  const sizeLabel = perf.measure === "units" ? "Units" : "Sales";

  usePerfStoreBundle(fetchBundle);

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
    const built = mergeLastWeek(
      buildStorePairs(perf.weekTy, perf.weekLy, shownGroupDay, nameOf, pick),
      buildStorePairs(perf.weekTy, perf.weekLw, shownGroupDay, nameOf, pick),
    );
    // Unsorted is a real state, not a missing default — see `storeSort`.
    return perf.storeSort
      ? sortPairs(built, perf.storeSort.key, storeNumberOf, perf.storeSort.reversed)
      : built;
  }, [
    perf.weekTy,
    perf.weekLy,
    perf.weekLw,
    shownGroupDay,
    perf.storeSort,
    perf.measure,
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
  const itemScope: ItemScope = isStore
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

  usePerfItems(itemKey, itemScope);

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


  const totals = useMemo(
    () =>
      buildTotals(
        perf.weekTy,
        perf.weekLy,
        active.hourlyTy,
        active.subsTy,
        cardDay,
        scopeKey,
        perf.weekLw,
        pick,
      ),
    [perf.weekTy, perf.weekLy, perf.weekLw, active, cardDay, scopeKey, perf.measure],
  );

  /** The whole week's day matching for the open card's store. */
  const weekMatch = useMemo(
    () => scopeMatch(perf.weekTy, perf.weekLy, scopeKey),
    [perf.weekTy, perf.weekLy, scopeKey],
  );
  /** The same for last week, which the lists pair against beside last year. */
  const weekMatchLw = useMemo(
    () => scopeMatch(perf.weekTy, perf.weekLw, scopeKey),
    [perf.weekTy, perf.weekLw, scopeKey],
  );

  /** The group's own total, always the full week — a fixed reference the card
   *  figures can be read against, so scoping one card to a day doesn't move
   *  the number above it. */
  const groupTotals = useMemo(
    () =>
      buildTotals(perf.weekTy, perf.weekLy, [], [], null, null, perf.weekLw, pick),
    [perf.weekTy, perf.weekLy, perf.weekLw, perf.measure],
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
        ? mergeLastWeek(
            buildSubPairs(active.subsTy, active.subsLy, cardDay, weekMatch, pick),
            buildSubPairs(active.subsTy, active.subsLw ?? [], cardDay, weekMatchLw, pick),
          )
        : perf.drill === "hours"
          ? mergeLastWeek(
              buildHourPairs(active.hourlyTy, active.hourlyLy, cardDay, weekMatch, pick),
              buildHourPairs(
                active.hourlyTy,
                active.hourlyLw ?? [],
                cardDay,
                weekMatchLw,
                pick,
              ),
            ).sort((a, b) => Number(a.key) - Number(b.key))
          : [];
    // No chip pressed means the order the list was built in — size for sub
    // departments, time for hours.
    return drillSort
      ? sortPairs(rows, drillSort.key, undefined, drillSort.reversed)
      : rows;
  }, [perf.drill, drillSort, cardDay, active, weekMatch, weekMatchLw, perf.measure]);

  const itemMatch = useMemo(
    () => (itemScope ? scopeMatch(perf.weekTy, perf.weekLy, scopeKey) : undefined),
    [perf.weekTy, perf.weekLy, scopeKey, itemScope?.key],
  );
  const itemMatchLw = useMemo(
    () => (itemScope ? scopeMatch(perf.weekTy, perf.weekLw, scopeKey) : undefined),
    [perf.weekTy, perf.weekLw, scopeKey, itemScope?.key],
  );

  const allItemPairs = useMemo(() => {
    if (!openItems) return [];
    const rows = mergeLastWeek(
      buildItemPairs(openItems.ty, openItems.ly, cardDay, itemMatch, pick),
      buildItemPairs(openItems.ty, openItems.lw ?? [], cardDay, itemMatchLw, pick),
    );
    return perf.itemSort
      ? sortPairs(rows, perf.itemSort.key, undefined, perf.itemSort.reversed)
      : rows;
  }, [openItems, cardDay, perf.itemSort, itemMatch, itemMatchLw, perf.measure]);
  const itemPairs = useMemo(
    () => filterItemPairs(allItemPairs, perf.itemQuery),
    [allItemPairs, perf.itemQuery],
  );
  const listMax = storePairs.reduce(
    (m, p) => Math.max(m, p.ty, p.ly, p.lw ?? 0),
    0,
  );

  const totalsPartial = isPartialMatch({
    days: totals.days ?? undefined,
    lyDays: totals.lyDays ?? undefined,
  });
  const listPartial = !cardDay && isPartialMatch(weekMatch);
  /** Nothing on file last year for the open card's scope — drawn as "no
   *  history", not a $0.00 bar. */
  const cardNoLy = noLyHistory(weekMatch, cardDay);
  /** The day chart's second column: last year, or last week where last year
   *  has nothing on file for this scope. The bars under it draw both. */
  const chartBasis: CmpBasis = noLyHistory(weekMatch, null) ? "lw" : "ly";
  const days = useMemo(
    () =>
      buildDays(
        perf.weekTy,
        chartBasis === "lw" ? perf.weekLw : perf.weekLy,
        scopeKey,
        pick,
      ),
    [perf.weekTy, perf.weekLy, perf.weekLw, scopeKey, chartBasis, perf.measure],
  );

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

  const scopeName = isGroupSearch(searched.type)
    ? searched.groupName
    : nameOf(searched.lastStore, perf.weekTy[0]?.store_name);

  /** What the open card is about, for the detail view's header. */
  const openStoreName = groupOpen
    ? scopeName
    : (storePairs.find((p) => p.key === openKey)?.label ?? "this store");

  /** Sales or units, in the page's own card: the group card on a group
   *  search, the store's card on a single-store one. */
  const measureSwitch = (
    <MeasureSwitch value={perf.measure} onChange={(m) => dispatch(setPerfMeasure(m))} />
  );

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
      fmt={fmt}
      sizeLabel={sizeLabel}
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
        // Nothing sold this week, but the department is in the list because
        // last year's rows put it there. The pairs still render — every one
        // at $0.00 against its last-year figure — so the list needs to say
        // why rather than leave the reader to infer it from a column of
        // zeroes.
        noTy: !!openItems && openItems.ty.length === 0 && openItems.ly.length > 0,
      }}
    />
  ) : null;

  // hasSearched false means "show me the search card" — either the first visit
  // or a deliberate return via the range chip. The second clause covers a
  // search that came back empty.
  if (!perf.hasSearched || (!perf.loading && perf.weekTy.length === 0)) {
    return <PerfSearchScreen onSearch={fetchPerf} />;
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
          {isGroupSearch(searched.type) && (
            <section
              ref={groupOpen ? openCard : undefined}
              className={`overflow-hidden rounded-2xl border bg-custom-white shadow-md transition-colors ${
                groupOpen ? "border-line_strong" : "border-line_field"
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
                actions={measureSwitch}
              />

              {/* Collapsed, it is the whole-group answer — and it stays on screen
                  while a store card is open, because that is when it is most
                  use: a store figure means little without the total it is part
                  of. Store cards minimise for each other because they compete
                  for the same attention; the group total is the denominator, not
                  a peer. */}
              {!groupOpen && (
                <div className="px-3.5 pb-3.5 pt-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-2.5">
                    <span className="font-display text-[24px] font-extrabold leading-none tracking-tight text-content">
                      {fmt(groupTotals.value)}
                    </span>
                    <PerfDelta
                      ty={groupTotals.value}
                      ly={
                        noLyHistory(groupMatch, null)
                          ? groupTotals.valueLw
                          : groupTotals.valueLy
                      }
                      format={fmt}
                      unavailable={noLyHistory(groupMatch, null) && groupTotals.noLw}
                      className="ml-auto"
                    />
                  </div>
                  <div className="mt-2.5">
                    <PairedBars
                      ty={groupTotals.value}
                      ly={groupTotals.valueLy}
                      lw={groupTotals.valueLw}
                      max={Math.max(
                        groupTotals.value,
                        groupTotals.valueLy,
                        groupTotals.valueLw,
                      )}
                      compact
                      labels={["TY", "LY", "LW"]}
                      format={fmt}
                      lyUnavailable={noLyHistory(groupMatch, null)}
                      lwUnavailable={groupTotals.noLw}
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
                  basis={chartBasis}
                  totals={totals}
                  bundleLoading={bundleLoading}
                  totalsPartial={totalsPartial}
                  totalsNote={matchedNote(totals)}
                  onViewDetails={() => dispatch(openPerfDetail(true))}
                  fmt={fmt}
                />
              )}
            </section>
          )}

          {/* ── how the list is ordered and narrowed ─────────────── */}
          {isGroupSearch(searched.type) && (
            <StoreListControls
              sizeLabel={sizeLabel}
              storeFilter={storeFilter}
              setStoreFilter={setStoreFilter}
            />
          )}

          {/* ── the stores ──────────────────────────────────────── */}
          {visibleStores.length === 0 ? (
            <section className="rounded-2xl border border-line_field bg-custom-white px-4 py-8 text-center text-[12.5px] text-content/95 shadow-md">
              {storeFilter.trim()
                ? `No store matches "${storeFilter.trim()}".`
                : "Nothing recorded for this week."}
            </section>
          ) : (
            visibleStores.map((p) => {
              const isOpen = p.key === openKey;
              return (
                <div key={p.key} ref={isOpen ? openCard : undefined}>
                  <MobilePerfCard
                    label={p.label}
                    change={
                      <PerfChange pct={gradedChangePct(p)} format={fmtChange} />
                    }
                    flagged={isPartialMatch(p)}
                    flagNote={matchedNote(p)}
                    bars={
                      <PairedBars
                        ty={p.ty}
                        ly={p.ly}
                        lw={p.lw ?? 0}
                        max={listMax}
                        labels={["TY", "LY", "LW"]}
                        format={fmt}
                        lyUnavailable={p.noLy}
                        lwUnavailable={p.noLw}
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
                    actions={isStore ? measureSwitch : undefined}
                  >
                    {isOpen && (
                      <PerfStoreReport
                        days={days}
                        selectedDay={shownDay}
                        onToggleDay={(iso) => dispatch(togglePerfDay(iso))}
                        noLy={cardNoLy}
                        basis={chartBasis}
                        totals={totals}
                        bundleLoading={bundleLoading}
                        totalsPartial={totalsPartial}
                        totalsNote={matchedNote(totals)}
                        onViewDetails={() => dispatch(openPerfDetail(true))}
                        fmt={fmt}
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
