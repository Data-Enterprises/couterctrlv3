// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector, useStoreName } from "../../../../../hooks";
import { useSalesCtx } from "../../hooks";

// Redux
import {
  setSubSales,
  setHourlySales,
  setHourlySalesLastWeek,
  setHourlySalesLastYear,
  setPeriodSubSales,
} from "../../../../../features/dev/devSalesSlice";
import {
  clearPopupSelections,
  cacheStoreData,
  restoreStoreData,
} from "../../../../../features/dev/devSalesLedgerSlice";

// API
import { getSubs, getHourly } from "../../../../../api/sales";

// Utils
import { shiftIso } from "../../../../../utils/grading";
import { sameWeekDayLastYear } from "../../../../../utils";
import { applyStoreNumberToName, scopeToStoreNumber } from "../../utils/ledgerUtils";
import { buildDateLabels, buildWeekWindow } from "../utils";

// Interfaces
import type { StoreSelection } from "../../../../../interfaces";

/**
 * Stores whose six calls are already in the air.
 *
 * Outside the component because it has to survive a remount, which is the
 * whole case it exists for. Keyed by store AND number: co-located stores
 * share an id and are two different answers.
 */
const inFlightStores = new Set<string>();

/** The searched week and its comparison weeks, from the search's date. */
export const useWeekWindow = () => {
  const singleDate = useAppSelector((state) => state.search.singleDate);
  return useMemo(() => buildWeekWindow(singleDate), [singleDate]);
};

/** The KPI strip's date lines, following the picked day. */
export const useDateLabels = () => {
  const { selectedDate } = useSalesCtx();
  const window = useWeekWindow();
  return buildDateLabels(window, selectedDate);
};

/**
 * The open store's name as the left-hand row shows it: resolved via
 * assignedStores, then, for co-located stores only, the embedded number
 * swapped to this location's.
 */
export const useStoreNames = (selection: StoreSelection) => {
  const resolvedStoreName = useStoreName(selection.storeId, selection.storeName);
  const headerStoreName = applyStoreNumberToName(
    resolvedStoreName,
    selection.storeNumber,
    selection.storeNumbersForId,
  );
  return { resolvedStoreName, headerStoreName };
};

/** Loads the open store's six row sets (subs and hourly, for this week, last
 *  week and last year) into the ledger slice. Returns whether it is loading. */
export const useStorePanelFetch = (selection: StoreSelection) => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { lastFetchedStoreKey, storeCache } = useSalesCtx();
  const { twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd } = useWeekWindow();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Remounting with data already fetched for this exact store (e.g.
    // navigating away and back) shouldn't refire the request — Redux still
    // has it, only the component tree was torn down.
    const storeKey = `${selection.storeId}__${selection.storeNumber}`;
    if (lastFetchedStoreKey === storeKey) return;
    // Both of the guards above land only once the six calls have come back.
    // StrictMode mounts, unmounts and mounts again in development, so the
    // second run read the state the first had not written yet and sent all
    // six a second time.
    if (inFlightStores.has(storeKey)) return;
    // Held from an earlier visit: six calls saved, and the panel paints on
    // this tick rather than after a round trip. Clients hop between stores --
    // that is what the counterpart is for -- so this is the common path, not
    // a clever one.
    if (storeCache[storeKey]) {
      dispatch(clearPopupSelections());
      dispatch(restoreStoreData(storeKey));
      return;
    }
    dispatch(clearPopupSelections());
    const scopeToStore = <T extends { store_number: string }>(rows: T[]) =>
      scopeToStoreNumber(rows, selection.storeNumber);
    inFlightStores.add(storeKey);
    const fetch = async () => {
      setLoading(true);
      try {
        const [
          subsResp,
          lwSubsResp,
          lySubsResp,
          hourlyResp,
          lwHourlyResp,
          lyHourlyResp,
        ] = await Promise.all([
          getSubs(
            context.url,
            context.token,
            twStart,
            twEnd,
            0,
            selection.storeId,
            1,
          ),
          getSubs(
            context.url,
            context.token,
            lwStart,
            lwEnd,
            0,
            selection.storeId,
            1,
          ),
          getSubs(
            context.url,
            context.token,
            lyStart,
            lyEnd,
            0,
            selection.storeId,
            1,
          ),
          getHourly(
            context.url,
            context.token,
            twStart,
            twEnd,
            0,
            selection.storeId,
            1,
          ),
          getHourly(
            context.url,
            context.token,
            lwStart,
            lwEnd,
            0,
            selection.storeId,
            1,
          ),
          getHourly(
            context.url,
            context.token,
            lyStart,
            lyEnd,
            0,
            selection.storeId,
            1,
          ),
        ]);
        // One dispatch, not seven. The six arrays are a single answer, and
        // caching them separately would let a store keep its own subs beside
        // somebody else's hourly.
        dispatch(
          cacheStoreData({
            key: storeKey,
            data: {
              rawSubs:
                subsResp.data.error === 0
                  ? scopeToStore(subsResp.data.subs)
                  : [],
              rawLWSubs:
                lwSubsResp.data.error === 0
                  ? scopeToStore(lwSubsResp.data.subs)
                  : [],
              rawLYSubs:
                lySubsResp.data.error === 0
                  ? scopeToStore(lySubsResp.data.subs)
                  : [],
              rawHourly:
                hourlyResp.data.error === 0
                  ? scopeToStore(hourlyResp.data.subs)
                  : [],
              rawLWHourly:
                lwHourlyResp.data.error === 0
                  ? scopeToStore(lwHourlyResp.data.subs)
                  : [],
              rawLYHourly:
                lyHourlyResp.data.error === 0
                  ? scopeToStore(lyHourlyResp.data.subs)
                  : [],
            },
          }),
        );
      } finally {
        inFlightStores.delete(storeKey);
        setLoading(false);
      }
    };
    fetch();
  }, [selection.storeId, selection.storeNumber]);

  return loading;
};

/** Narrows the open store's rows to the picked day (or the matched week) for
 *  the Sub depts and Hourly tabs. */
export const useDayScopedSales = () => {
  const dispatch = useAppDispatch();
  const {
    selectedDate,
    rawSubs,
    rawLWSubs,
    rawLYSubs,
    rawHourly,
    rawLWHourly,
    rawLYHourly,
  } = useSalesCtx();
  const { lwWeekDates, lyWeekDates } = useWeekWindow();

  useEffect(() => {
    if (!rawSubs.length && !rawHourly.length) return;

    if (selectedDate === null) {
      // The raw LW/LY arrays can include days that don't actually correspond
      // to any day in this TW week (the LY range is deliberately widened
      // around holidays, and the underlying data itself is fragmented) —
      // filter down to the exact matched date set before aggregating, same
      // as buildLedgerRows already does for the store-level totals, so the
      // sub-dept/hourly figures agree with the KPI header above them.
      const lwDateSet = new Set(lwWeekDates);
      const lyDateSet = new Set(lyWeekDates);
      dispatch(setSubSales(rawSubs));
      dispatch(
        setPeriodSubSales({
          subs: rawLWSubs.filter((s) =>
            lwDateSet.has(s.sale_date.split("T")[0]),
          ),
          period: 2,
        }),
      );
      dispatch(
        setPeriodSubSales({
          subs: rawLYSubs.filter((s) =>
            lyDateSet.has(s.sale_date.split("T")[0]),
          ),
          period: 3,
        }),
      );
      dispatch(setHourlySales(rawHourly));
      dispatch(
        setHourlySalesLastWeek(
          rawLWHourly.filter((h) => lwDateSet.has(h.sale_date.split("T")[0])),
        ),
      );
      dispatch(
        setHourlySalesLastYear(
          rawLYHourly.filter((h) => lyDateSet.has(h.sale_date.split("T")[0])),
        ),
      );
    } else {
      dispatch(
        setSubSales(
          rawSubs.filter((s) => s.sale_date.startsWith(selectedDate)),
        ),
      );
      const lwDay = shiftIso(selectedDate, -7);
      const lyDay = sameWeekDayLastYear(selectedDate).date;
      dispatch(
        setPeriodSubSales({
          subs: rawLWSubs.filter((s) => s.sale_date.startsWith(lwDay)),
          period: 2,
        }),
      );
      dispatch(
        setPeriodSubSales({
          subs: rawLYSubs.filter((s) => s.sale_date.startsWith(lyDay)),
          period: 3,
        }),
      );
      dispatch(
        setHourlySales(
          rawHourly.filter((h) => h.sale_date.startsWith(selectedDate)),
        ),
      );
      dispatch(
        setHourlySalesLastWeek(
          rawLWHourly.filter((h) => h.sale_date.startsWith(lwDay)),
        ),
      );
      dispatch(
        setHourlySalesLastYear(
          rawLYHourly.filter((h) => h.sale_date.startsWith(lyDay)),
        ),
      );
    }
  }, [
    selectedDate,
    rawSubs,
    rawLWSubs,
    rawLYSubs,
    rawHourly,
    rawLWHourly,
    rawLYHourly,
  ]);
};
