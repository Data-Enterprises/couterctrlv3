// Hooks
import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";
import { useToast } from "../../../../../../components/toasts/hooks/useToast";

// Redux
import {
  cachePerfItems,
  cachePerfStoreData,
  clearPerfStoreCache,
  emptyBundle,
  failPerfItems,
  failPerfStoreData,
  GROUP_KEY,
  setPerfGroupData,
  setPerfHasSearched,
  setPerfSearched,
  setPerfItemLoading,
  setPerfLoading,
  setPerfStoreLoading,
  setPerfWeek,
  type PerfBundle,
} from "../../../../../../features/dev/devSalesPerfSlice";

// API
import { getHourly, getSubs, getWeekly } from "../../../../../../api/sales";

// Utils
import {
  fetchSubDeptRowsOrEmpty,
  fetchSubDeptRowsSafe,
} from "../../../../../../utils/marginRows";
import { foldDepartmentRings } from "../../../utils/ledgerUtils";
import { asLastYearSlots } from "../../../../../../utils/perfPairs";
import { pickComparison, resolveWeekComparison, storeKeyOf } from "../utils/perfData";
import { perfScopeOf, perfWeekOf } from "../utils";

// Interfaces
import type {
  HourlySale,
  JsonError,
  SubDeptMargin,
  SubSale,
} from "../../../../../../interfaces";
import type { ItemScope } from "../interfaces";

/** What was searched, else the picker before a search. */
export const usePerfSearched = () => {
  const search = useAppSelector((s) => s.search);
  const searched = useAppSelector((s) => s.dev.salesPerf.searched);
  return (
    searched ?? {
      singleDate: search.singleDate,
      type: search.type,
      lastStore: search.lastStore,
      lastGroup: search.lastGroup,
      groupName: search.selectedGroup?.group_name ?? "",
    }
  );
};

/** What the search asked for: one store, or a group. */
export const usePerfScope = () => {
  const { type, lastStore, lastGroup } = usePerfSearched();
  return useMemo(
    () => perfScopeOf({ type, lastStore, lastGroup }),
    [type, lastStore, lastGroup],
  );
};

/** The searched week, its day-matched days last year, and the week before. */
export const usePerfWeek = () => {
  const { singleDate } = usePerfSearched();
  return useMemo(() => perfWeekOf(singleDate), [singleDate]);
};

/** The two loads behind the screen: the week for the search (with a single
 *  store's bundle), and one scope's sub-department and hourly bundle. */
export const usePerfFetch = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const searchedWeek = usePerfWeek();

  /** Sub-department and hourly rows for one scope, both periods: a card opened
   *  later loads the searched week; the search passes the picker's. */
  const fetchBundle = async (
    grouped: number,
    value: number,
    single: number,
    week = searchedWeek,
  ): Promise<PerfBundle> => {
    const { twStart, twEnd, lyDates, lwStart, lwEnd } = week;
    const args = [grouped, value, single] as const;
    const [hTy, hLy, hLw, sTy, sLy, sLw] = await Promise.all([
      getHourly(context.url, context.token, twStart, twEnd, ...args),
      getHourly(context.url, context.token, lyDates[0], lyDates[6], ...args),
      getHourly(context.url, context.token, lwStart, lwEnd, ...args),
      getSubs(context.url, context.token, twStart, twEnd, ...args),
      getSubs(context.url, context.token, lyDates[0], lyDates[6], ...args),
      getSubs(context.url, context.token, lwStart, lwEnd, ...args),
    ]);
    // getHourly and getSubs both answer on `.subs`, not `.sales`.
    const rows = (r: { data: { error: number; subs: unknown[] } }) =>
      r.data.error === 0 ? r.data.subs : [];
    // A bundle is one store, so subs and hours fall back together. Deciding
    // them separately could show Subs against last year and Hours against
    // last week on one card, which is two different questions side by side.
    const hourly = pickComparison(
      rows(hLy) as HourlySale[],
      rows(hLw) as HourlySale[],
    );
    const subs = pickComparison(
      rows(sLy) as SubSale[],
      rows(sLw) as SubSale[],
    );
    return {
      // Last year as it is. Last week is its own bar now, so a store with no
      // last year shows "no history" there rather than last week twice.
      // `basis` still records which one grades it.
      hourlyTy: rows(hTy) as HourlySale[],
      hourlyLy: rows(hLy) as HourlySale[],
      subsTy: rows(sTy) as SubSale[],
      subsLy: rows(sLy) as SubSale[],
      // Last week as well, shown beside last year rather than only in place
      // of it. Re-dated into last year's slots so it pairs the same way.
      hourlyLw: asLastYearSlots(rows(hLw) as HourlySale[]),
      subsLw: asLastYearSlots(rows(sLw) as SubSale[]),
      basis: subs.basis === "lw" && hourly.basis === "lw" ? "lw" : subs.basis,
    };
  };

  const fetchPerf = async () => {
    const { isStore, useGroups, searchValue, singleStore } = perfScopeOf(search);
    const week = perfWeekOf(search.singleDate);
    const { twStart, twEnd, lyDates, lwStart, lwEnd } = week;
    dispatch(
      setPerfSearched({
        singleDate: search.singleDate,
        type: search.type,
        lastStore: search.lastStore,
        lastGroup: search.lastGroup,
        groupName: search.selectedGroup?.group_name ?? "",
      }),
    );
    dispatch(setPerfLoading(true));
    // Every cached store bundle belongs to the old date range.
    dispatch(clearPerfStoreCache());
    try {
      const args = [useGroups, searchValue, singleStore] as const;
      const [wTy, wLy, wLw, bundle] = await Promise.all([
        getWeekly(context.url, context.token, twStart, twEnd, ...args),
        getWeekly(context.url, context.token, lyDates[0], lyDates[6], ...args),
        getWeekly(context.url, context.token, lwStart, lwEnd, ...args),
        // A group search no longer loads a group-wide breakdown: there is
        // nowhere on screen to show one now that Subs and Hours live inside a
        // store card, and each card fetches its own on the way open. A single
        // store still needs one up front, because its one card opens with the
        // screen. That takes a group search from six calls to two.
        isStore
          ? fetchBundle(useGroups, searchValue, singleStore, week)
          : Promise.resolve(emptyBundle()),
      ]);

      const ty = wTy.data.error === 0 ? wTy.data.sales : [];
      const ly = wLy.data.error === 0 ? wLy.data.sales : [];
      const lw = wLw.data.error === 0 ? wLw.data.sales : [];
      dispatch(
        setPerfWeek({
          ty,
          ly,
          basis: resolveWeekComparison(ty, ly, lw).basis,
          lw: asLastYearSlots(lw),
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

  return { fetchBundle, fetchPerf };
};

/** Loads a store card's bundle the first time it is opened. */
export const usePerfStoreBundle = (
  fetchBundle: (grouped: number, value: number, single: number) => Promise<PerfBundle>,
) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const perf = useAppSelector((s) => s.dev.salesPerf);
  const { useGroups, searchValue, singleStore } = usePerfScope();

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
};

/** Loads an open sub department's items for one store, once per search. */
export const usePerfItems = (itemKey: string | null, itemScope: ItemScope) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const perf = useAppSelector((s) => s.dev.salesPerf);
  const { twStart, twEnd, lyDates, lwStart, lwEnd } = usePerfWeek();

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
    // The department's own sales (rung on the department key, no item) are
    // kept as one labelled row rather than dropped, so the list adds up to the
    // department figure above it.
    const scoped = (rows: SubDeptMargin[]) =>
      foldDepartmentRings(rows).filter(
        (r) =>
          storeNumber === null ||
          String(r.store_number).trim().replace(/^0+/, "") ===
            storeNumber.trim().replace(/^0+/, ""),
      );

    dispatch(setPerfItemLoading(key));
    Promise.all([
      // "No records" is a real answer here, not a failure: a department can
      // sell nothing this week and still be in the list, because the list is
      // built from either year. Throwing on it put the drill on a toast and a
      // spinner that never resolved. A rejection — network, auth, 5xx — still
      // throws and still toasts.
      fetchSubDeptRowsOrEmpty(
        context.url,
        context.token,
        subId,
        twStart,
        twEnd,
        0,
        storeid,
        1,
      ),
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
      // And last week, for the store that has no last year to answer with.
      // Safe for the same reason as the line above.
      fetchSubDeptRowsSafe(
        context.url,
        context.token,
        subId,
        lwStart,
        lwEnd,
        0,
        storeid,
        1,
      ),
    ])
      .then(([ty, ly, lw]) => {
        // Scoped to the store before the pick, so the choice is made on the
        // rows this department actually has rather than the whole payload.
        const cmp = pickComparison(scoped(ly), scoped(lw));
        dispatch(
          cachePerfItems({
            key,
            items: {
              ty: scoped(ty),
              ly: scoped(ly),
              basis: cmp.basis,
              lw: asLastYearSlots(scoped(lw)),
            },
            gen,
          }),
        );
      })
      .catch((err: JsonError) => {
        dispatch(failPerfItems(key));
        toast.error("Error loading items: " + err.message);
      });
  }, [itemKey]);
};

/** The phone Performance slice, read where it is used instead of passed down. */
export const useSalesPerfState = () => useAppSelector((s) => s.dev.salesPerf);
