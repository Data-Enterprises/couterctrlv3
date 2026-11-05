// Hooks
import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";
import { useToast } from "../../../../../../components/toasts/hooks/useToast";

// Redux
import { isGroupSearch } from "../../../../../../features/searchSlice";
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
  setPerfItemLoading,
  setPerfLoading,
  setPerfStoreLoading,
  setPerfWeek,
} from "../../../../../../features/dev/devSalesPerfSlice";

// API
import { getHourly, getSubs, getWeekly } from "../../../../../../api/sales";

// Utils
import {
  fetchSubDeptRowsOrEmpty,
  fetchSubDeptRowsSafe,
} from "../../../../../../utils/marginRows";
import { addDays, formatGoliathDate, sameWeekDayLastYear } from "../../../../../../utils";
import { withProductCode } from "../../../utils/ledgerUtils";
import { pickComparison, resolveWeekComparison, storeKeyOf } from "../utils/perfData";

// Interfaces
import type { PerfBundle } from "../../../../../../features/dev/devSalesPerfSlice";
import type {
  HourlySale,
  JsonError,
  SubDeptMargin,
  SubSale,
} from "../../../../../../interfaces";
import type { ItemScope } from "../interfaces";

/** What the search asked for: one store, or a group. */
export const usePerfScope = () => {
  const search = useAppSelector((s) => s.search);
  const isStore = !isGroupSearch(search.type);
  const useGroups = isStore ? 0 : 1;
  const searchValue = isStore ? search.lastStore : search.lastGroup;
  const singleStore = isStore ? 1 : 0;
  return { isStore, useGroups, searchValue, singleStore };
};

/** The searched week, its day-matched days last year, and the week before. */
export const usePerfWeek = () => {
  const singleDate = useAppSelector((s) => s.search.singleDate);
  return useMemo(() => {
    /** The seven days of the selected week, and their day-matched partners last
     *  year. Shifting only the two endpoints breaks when one lands on a
     *  fixed-date holiday: that end snaps to the holiday while the other keeps a
     *  weekday shift, and the range stops lining up with the per-day lookups. */
    // singleDate is m/d/yyyy off formatDate; Goliath wants yyyy-mm-dd. Passing
    // the raw picker value returns an empty result rather than an error.
    const twEnd = formatGoliathDate(singleDate);
    const twStart = addDays(singleDate, -6).toISOString().split("T")[0];
    const lyDates = Array.from(
      { length: 7 },
      (_, i) =>
        sameWeekDayLastYear(addDays(twStart, i).toISOString().split("T")[0]).date,
    ).sort();
    /** The same week, seven days back. Fetched beside last year on every call,
     *  and used only where last year came back empty — a store onboarded this
     *  year has no last year, and one bar is not a comparison. Asking for both
     *  up front rather than refetching on a miss keeps it to one round trip:
     *  the miss is only known once the answer is in. */
    const lwStart = addDays(twStart, -7).toISOString().split("T")[0];
    const lwEnd = addDays(twEnd, -7).toISOString().split("T")[0];
    return { twStart, twEnd, lyDates, lwStart, lwEnd };
  }, [singleDate]);
};

/** The two loads behind the screen: the week for the search (with a single
 *  store's bundle), and one scope's sub-department and hourly bundle. */
export const usePerfFetch = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const { isStore, useGroups, searchValue, singleStore } = usePerfScope();
  const { twStart, twEnd, lyDates, lwStart, lwEnd } = usePerfWeek();

  /** Sub-department and hourly rows for one scope, both periods. */
  const fetchBundle = async (
    grouped: number,
    value: number,
    single: number,
  ): Promise<PerfBundle> => {
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
      hourlyTy: rows(hTy) as HourlySale[],
      hourlyLy: hourly.rows,
      subsTy: rows(sTy) as SubSale[],
      subsLy: subs.rows,
      basis: subs.basis === "lw" && hourly.basis === "lw" ? "lw" : subs.basis,
    };
  };

  const fetchPerf = async () => {
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
          ? fetchBundle(useGroups, searchValue, singleStore)
          : Promise.resolve(emptyBundle()),
      ]);

      const ty = wTy.data.error === 0 ? wTy.data.sales : [];
      const cmp = resolveWeekComparison(
        ty,
        wLy.data.error === 0 ? wLy.data.sales : [],
        wLw.data.error === 0 ? wLw.data.sales : [],
      );
      dispatch(setPerfWeek({ ty, ly: cmp.rows, basis: cmp.basis }));
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
    const scoped = (rows: SubDeptMargin[]) =>
      withProductCode(rows).filter(
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
            items: { ty: scoped(ty), ly: cmp.rows, basis: cmp.basis },
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
