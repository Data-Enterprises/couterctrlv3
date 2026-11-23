// Hooks
import { useDeferredValue, useMemo } from "react";
import { useSalesCtx } from "../../../hooks";
import { usePerfItems, usePerfScope, useSalesPerfState } from ".";

// Redux
import {
  emptyBundle,
  GROUP_KEY,
  type PerfBundle,
} from "../../../../../../features/salesPerfSlice";

// Utils
import { resolveStoreName } from "../../../../../../utils";
import {
  buildDays,
  buildHourPairs,
  buildItemPairs,
  buildStorePairs,
  buildSubPairs,
  buildTotals,
  filterItemPairs,
  isPartialMatch,
  mergeLastWeek,
  noLyHistory,
  pickFor,
  scopeMatch,
  sortPairs,
  storeKeyOf,
  type CmpBasis,
} from "../utils/perfData";
import { storeNumberOf } from "../utils";

// Interfaces
import type { ItemScope } from "../interfaces";

/**
 * The store list: every store's paired figures for the group's day, sorted
 * as the chips set it, then narrowed by the filter box.
 *
 * The group's day scopes the whole list; a store card's scopes only itself.
 * A store card opens on the group's day and can override it, which is what
 * `shownDay`'s fallback says. Deferred because rebuilding the list and the
 * open report is synchronous — a tap has to register before that work
 * starts, and the chart's own highlight reads the same deferred value so the
 * column and the rows it scopes move on one render.
 */
export const usePerfStores = (storeFilter: string) => {
  const perf = useSalesPerfState();
  const { assignedStores, selectedGroupStores } = useSalesCtx();

  /** The name the user knows a store by, never the one the payload sent.
   *  Group searches can include stores nobody is personally assigned to, which
   *  is what `selectedGroupStores` covers. */
  const nameOf = (storeid: number, fallback?: string) =>
    resolveStoreName(assignedStores, selectedGroupStores, storeid, fallback);

  /** Sales or units, everywhere a figure is drawn. */
  const pick = pickFor(perf.measure);

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
      ? sortPairs(
          built,
          perf.storeSort.key,
          storeNumberOf,
          perf.storeSort.reversed,
        )
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

  const visibleStores = useMemo(() => {
    const q = storeFilter.trim().toLowerCase();
    if (!q) return storePairs;
    return storePairs.filter(
      (p) =>
        p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q),
    );
  }, [storePairs, storeFilter]);

  const listMax = storePairs.reduce(
    (m, p) => Math.max(m, p.ty, p.ly, p.lw ?? 0),
    0,
  );

  return {
    nameOf,
    shownGroupDay,
    shownDay,
    storePairs,
    visibleStores,
    listMax,
  };
};

/**
 * Which card is open and what it reads: its store key, its day, its bundle,
 * and the open sub department's items (fetched here through `usePerfItems`).
 */
export const usePerfSelection = (
  storePairs: { key: string }[],
  shownGroupDay: string | null,
  shownDay: string | null,
) => {
  const perf = useSalesPerfState();
  const { isStore, searchValue } = usePerfScope();

  const openKey = isStore ? (storePairs[0]?.key ?? null) : perf.selectedStore;

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

  const bundleLoading =
    openKey !== null && !isStore && !perf.storeData[openKey];

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
            (r) =>
              r.storeid === row.storeid && r.store_number !== row.store_number,
          );
          return {
            key: storeKeyOf(row),
            storeid: row.storeid,
            storeNumber: shared ? row.store_number : null,
          };
        })();

  const itemKey =
    itemScope && perf.openSubDept
      ? `${itemScope.key}|${perf.openSubDept.key}`
      : null;

  usePerfItems(itemKey, itemScope);

  const openItems = itemKey ? perf.itemData[itemKey] : undefined;
  const itemsLoading = itemKey !== null && !openItems;

  return {
    openKey,
    groupOpen,
    scopeKey,
    cardDay,
    active,
    bundleLoading,
    itemScope,
    openItems,
    itemsLoading,
  };
};

/**
 * Every figure the screen draws for the open card and the group: the totals,
 * the day matching, the breakdown lists (sub departments, hours, items), and
 * the day chart.
 */
export const usePerfFigures = (sel: ReturnType<typeof usePerfSelection>) => {
  const perf = useSalesPerfState();
  const { active, cardDay, scopeKey, itemScope, openItems } = sel;
  const pick = pickFor(perf.measure);

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
    [
      perf.weekTy,
      perf.weekLy,
      perf.weekLw,
      active,
      cardDay,
      scopeKey,
      perf.measure,
    ],
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
      buildTotals(
        perf.weekTy,
        perf.weekLy,
        [],
        [],
        null,
        null,
        perf.weekLw,
        pick,
      ),
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
            buildSubPairs(
              active.subsTy,
              active.subsLy,
              cardDay,
              weekMatch,
              pick,
            ),
            buildSubPairs(
              active.subsTy,
              active.subsLw ?? [],
              cardDay,
              weekMatchLw,
              pick,
            ),
          )
        : perf.drill === "hours"
          ? mergeLastWeek(
              buildHourPairs(
                active.hourlyTy,
                active.hourlyLy,
                cardDay,
                weekMatch,
                pick,
              ),
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
  }, [
    perf.drill,
    drillSort,
    cardDay,
    active,
    weekMatch,
    weekMatchLw,
    perf.measure,
  ]);

  const itemMatch = useMemo(
    () =>
      itemScope ? scopeMatch(perf.weekTy, perf.weekLy, scopeKey) : undefined,
    [perf.weekTy, perf.weekLy, scopeKey, itemScope?.key],
  );
  const itemMatchLw = useMemo(
    () =>
      itemScope ? scopeMatch(perf.weekTy, perf.weekLw, scopeKey) : undefined,
    [perf.weekTy, perf.weekLw, scopeKey, itemScope?.key],
  );

  const allItemPairs = useMemo(() => {
    if (!openItems) return [];
    const rows = mergeLastWeek(
      buildItemPairs(openItems.ty, openItems.ly, cardDay, itemMatch, pick),
      buildItemPairs(
        openItems.ty,
        openItems.lw ?? [],
        cardDay,
        itemMatchLw,
        pick,
      ),
    );
    return perf.itemSort
      ? sortPairs(rows, perf.itemSort.key, undefined, perf.itemSort.reversed)
      : rows;
  }, [openItems, cardDay, perf.itemSort, itemMatch, itemMatchLw, perf.measure]);
  const itemPairs = useMemo(
    () => filterItemPairs(allItemPairs, perf.itemQuery),
    [allItemPairs, perf.itemQuery],
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

  return {
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
  };
};
