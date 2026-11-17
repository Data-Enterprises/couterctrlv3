// Hooks
import { useLayoutEffect, useRef, useState } from "react";
import { useAppDispatch } from "../../../../../hooks";
import {
  usePerfFetch,
  usePerfScope,
  usePerfSearched,
  usePerfStoreBundle,
  usePerfWeek,
  useSalesPerfState,
} from "./hooks";
import { usePerfFigures, usePerfSelection, usePerfStores } from "./hooks/view";

// Redux
import { isGroupSearch } from "../../../../../features/searchSlice";
import {
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
} from "../../../../../features/dev/devSalesPerfSlice";

// Utils
import { formatCurrency2, formatDateSimple } from "../../../../../utils";
import {
  dirOf,
  isPartialMatch,
  matchedNote,
  noLyHistory,
  fmtChange,
  gradedChangePct,
  fmtUnits,
} from "./utils/perfData";
import { DETAIL_TABS } from "./utils";

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
 * sits. Collapsed, a card carries only what the group `sales/daily` already
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

  const { isStore } = usePerfScope();
  const { twStart, twEnd } = usePerfWeek();
  const { fetchBundle, fetchPerf } = usePerfFetch();

  const fmt = perf.measure === "units" ? fmtUnits : formatCurrency2;
  const sizeLabel = perf.measure === "units" ? "Units" : "Sales";

  usePerfStoreBundle(fetchBundle);

  const {
    nameOf,
    shownGroupDay,
    shownDay,
    storePairs,
    visibleStores,
    listMax,
  } = usePerfStores(storeFilter);
  const sel = usePerfSelection(storePairs, shownGroupDay, shownDay);
  const {
    openKey,
    groupOpen,
    cardDay,
    bundleLoading,
    itemScope,
    openItems,
    itemsLoading,
  } = sel;

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

  const {
    totals,
    weekMatch,
    groupTotals,
    groupMatch,
    drillDim,
    drillSort,
    drillPairs,
    itemMatch,
    allItemPairs,
    itemPairs,
    totalsPartial,
    listPartial,
    cardNoLy,
    chartBasis,
    days,
  } = usePerfFigures(sel);

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
    <MeasureSwitch
      value={perf.measure}
      onChange={(m) => dispatch(setPerfMeasure(m))}
    />
  );

  const drillList = perf.drill ? (
    <PerfDrillList
      drill={perf.drill}
      pairs={drillPairs}
      sort={drillSort?.key ?? null}
      sortDir={drillSort ? dirOf(drillSort.key, drillSort.reversed) : null}
      onSort={(key) =>
        dispatch(setPerfSort({ dimension: drillDim, sort: key }))
      }
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
        noTy:
          !!openItems && openItems.ty.length === 0 && openItems.ly.length > 0,
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
        levelKey={`${perf.drill}|${perf.openSubDept?.key ?? ""}`}
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
                      unavailable={
                        noLyHistory(groupMatch, null) && groupTotals.noLw
                      }
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
                      isStore
                        ? () => dispatch(setPerfInfoOpen(true))
                        : undefined
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
