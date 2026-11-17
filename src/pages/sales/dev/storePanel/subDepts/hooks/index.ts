// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";

// Redux
import {
  setSelectedSubDeptItems,
  setInactiveSubDeptItems,
  setLastFetchedItemsKey,
} from "../../../../../../features/dev/devSalesLedgerSlice";
import { rememberCounterpart } from "../../../../../../features/dev/devSalesCacheSlice";

// API
import { getSubsDaily } from "../../../../../../api/sales";

// Utils
import { shiftIso } from "../../../../../../utils/grading";
import {
  formatGoliathDate,
  sameWeekDayLastYear,
} from "../../../../../../utils";
import { fetchSubDeptRowsSafe } from "../../../../../../utils/marginRows";
import { subDeptKey, subDeptNumber } from "../../../../../../utils/subDeptKey";
import {
  aggregateByCode,
  matchItemRows,
} from "../../../../../../utils/itemGrading";
import {
  scopeToStoreNumber,
  withProductCode,
} from "../../../utils/ledgerUtils";
import { day } from "../utils";

// Interfaces
import type { SubDeptMargin, SubSale } from "../../../../../../interfaces";

/** Sub departments whose item fetch is already in the air. Outside React
 *  because it has to survive the remount it exists to absorb. */
const inFlightItems = new Set<string>();

/**
 * Fetches the open sub department's items for this week, last week and last
 * year into the ledger slice, and clears them when it closes. Returns whether
 * a fetch is running.
 *
 * Items are fetched by storeid, which for co-located stores returns both
 * locations, so they are scoped down to `storeNumber`. `twRealDates` is the
 * full searched week, used to match last week's and last year's days.
 */
export const useSubDeptItems = (
  storeId: number,
  storeNumber: string,
  twRealDates: string[],
) => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  // The ledger's searched week, not the live picker (other pages move it).
  const weekDate = useAppSelector(
    (state) => state.dev.salesLedger.searchedDate ?? state.search.singleDate,
  );
  const {
    selectedDate,
    selectedSubDeptKey: selectedKey,
    lastFetchedItemsKey,
  } = useSalesCtx();
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    if (selectedKey === null) {
      dispatch(setSelectedSubDeptItems([]));
      dispatch(setInactiveSubDeptItems([]));
      // The cache key below means "these items are already in Redux", so it
      // has to be cleared alongside the items it refers to. Leaving it set
      // made re-selecting the same sub dept match the key and skip the
      // refetch, leaving the list permanently empty until something else
      // changed the key.
      dispatch(setLastFetchedItemsKey(null));
      return;
    }

    // Remounting with items already fetched for this exact store+sub
    // dept+day (e.g. navigating away and back) shouldn't refire the
    // request — Redux still has it, only the component tree was torn down.
    const itemsKey = `${storeId}__${storeNumber}_${selectedKey}_${selectedDate ?? "all"}`;
    if (lastFetchedItemsKey === itemsKey) return;
    // The guard above lands only once the three calls have come back, so
    // StrictMode's second mount read the state the first had not written yet
    // and asked for all three again.
    if (inFlightItems.has(itemsKey)) return;
    inFlightItems.add(itemsKey);

    const twEnd = formatGoliathDate(weekDate);
    const twStart = shiftIso(twEnd, -6);
    const lwStart = shiftIso(twEnd, -13);
    const lwEnd = shiftIso(twEnd, -7);
    const lyWeekDates = twRealDates
      .map((d) => sameWeekDayLastYear(d).date)
      .sort();
    const lyStart = lyWeekDates[0] ?? lwEnd;
    const lyEnd = lyWeekDates[lyWeekDates.length - 1] ?? lwEnd;
    const lwWeekDates = twRealDates.map((d) => shiftIso(d, -7));

    const tyStart = selectedDate ?? twStart;
    const tyEnd = selectedDate ?? twEnd;
    const lwDayStart = selectedDate ? shiftIso(selectedDate, -7) : lwStart;
    const lwDayEnd = selectedDate ? shiftIso(selectedDate, -7) : lwEnd;
    const lyDayStart = selectedDate
      ? sameWeekDayLastYear(selectedDate).date
      : lyStart;
    const lyDayEnd = selectedDate
      ? sameWeekDayLastYear(selectedDate).date
      : lyEnd;

    let cancelled = false;
    const fetch = async () => {
      setItemsLoading(true);
      try {
        // Paged, not page 1. `subs/subs` caps a response at 1000 rows and
        // reports `total_pages`; reading only the first page silently drops the
        // tail of the window, because rows come back date-ordered. A busy
        // department over a full week clears that cap, so this list was
        // reporting a short week while the dept rows above it reported a whole
        // one. Same helper Sub Dept Margins, Vendors and Item Actions use, so
        // there is one paging implementation rather than four.
        const [tyRaw, lwRaw, lyRaw] = await Promise.all([
          fetchSubDeptRowsSafe(
            context.url,
            context.token,
            subDeptNumber(selectedKey),
            tyStart,
            tyEnd,
            0,
            storeId,
            1,
          ),
          fetchSubDeptRowsSafe(
            context.url,
            context.token,
            subDeptNumber(selectedKey),
            lwDayStart,
            lwDayEnd,
            0,
            storeId,
            1,
          ),
          fetchSubDeptRowsSafe(
            context.url,
            context.token,
            subDeptNumber(selectedKey),
            lyDayStart,
            lyDayEnd,
            0,
            storeId,
            1,
          ),
        ]);
        if (cancelled) return;

        // withProductCode: the endpoint returns a department catch-all row
        // (product_code 0, described as the department) alongside the real
        // items. See ledgerUtils — it takes real money out of this list.
        // Fetched by number, kept by number AND name: ACE stores file several
        // departments under one number, and 0 asks for every department.
        const inDept = (rows: SubDeptMargin[]) =>
          rows.filter((r) => subDeptKey(r) === selectedKey);
        const tyItems: SubDeptMargin[] = withProductCode(
          inDept(scopeToStoreNumber(tyRaw, storeNumber)),
        );
        let lwItems: SubDeptMargin[] = withProductCode(
          inDept(scopeToStoreNumber(lwRaw, storeNumber)),
        );
        let lyItems: SubDeptMargin[] = withProductCode(
          inDept(scopeToStoreNumber(lyRaw, storeNumber)),
        );

        // Whole-week case: the fetched LW/LY rows can include days that
        // don't actually correspond to any day in this TW week — filter down
        // to the exact matched date set before aggregating, so item totals
        // agree with the dept-level and store-level figures shown elsewhere
        // in this same popup.
        if (!selectedDate) {
          const lwDateSet = new Set(lwWeekDates);
          const lyDateSet = new Set(lyWeekDates);
          lwItems = lwItems.filter((i) =>
            lwDateSet.has(i.sale_date.split("T")[0]),
          );
          lyItems = lyItems.filter((i) =>
            lyDateSet.has(i.sale_date.split("T")[0]),
          );
        }

        const tyMap = aggregateByCode(tyItems);
        const lwMap = aggregateByCode(lwItems);
        const lyMap = aggregateByCode(lyItems);
        const { tyForLW, tyForLY } = matchItemRows(tyItems, lwItems, lyItems);

        const sorted = [...tyMap.entries()].sort((a, b) => b[1].qty - a[1].qty);

        dispatch(
          setSelectedSubDeptItems(
            sorted.map(([code, ty]) => {
              const lw = lwMap.get(code) ?? null;
              const ly = lyMap.get(code) ?? null;
              return {
                productCode: code,
                upc: code,
                desc: ty.desc,
                tyNet: ty.net,
                tyQty: ty.qty,
                tyWeight: ty.weight,
                lwNet: lw?.net ?? null,
                lwQty: lw?.qty ?? null,
                lwWeight: lw?.weight ?? null,
                lyNet: ly?.net ?? null,
                lyQty: ly?.qty ?? null,
                lyWeight: ly?.weight ?? null,
                tyNetForLW: tyForLW.get(code)?.net ?? 0,
                tyQtyForLW: tyForLW.get(code)?.qty ?? 0,
                tyNetForLY: tyForLY.get(code)?.net ?? 0,
                tyQtyForLY: tyForLY.get(code)?.qty ?? 0,
              };
            }),
          ),
        );
        // Items that sold LW and/or LY but have no TY row at all — invisible
        // in the normal TY-anchored list above since it's built from tyMap
        // alone. Surfaced separately so someone can spot "this used to sell
        // here" without it polluting the active list's severity counts.
        const inactiveCodes = new Set(
          [...lwMap.keys(), ...lyMap.keys()].filter((code) => !tyMap.has(code)),
        );
        const inactiveSorted = [...inactiveCodes].sort((a, b) => {
          const aTotal = (lwMap.get(a)?.net ?? 0) + (lyMap.get(a)?.net ?? 0);
          const bTotal = (lwMap.get(b)?.net ?? 0) + (lyMap.get(b)?.net ?? 0);
          return bTotal - aTotal;
        });
        dispatch(
          setInactiveSubDeptItems(
            inactiveSorted.map((code) => {
              const lw = lwMap.get(code) ?? null;
              const ly = lyMap.get(code) ?? null;
              return {
                productCode: code,
                upc: code,
                desc: lw?.desc ?? ly?.desc ?? code,
                tyNet: 0,
                tyQty: 0,
                tyWeight: 0,
                hasTY: false,
                lwNet: lw?.net ?? null,
                lwQty: lw?.qty ?? null,
                lwWeight: lw?.weight ?? null,
                lyNet: ly?.net ?? null,
                lyQty: ly?.qty ?? null,
                lyWeight: ly?.weight ?? null,
              };
            }),
          ),
        );
        dispatch(setLastFetchedItemsKey(itemsKey));
      } finally {
        inFlightItems.delete(itemsKey);
        if (!cancelled) setItemsLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [
    selectedKey,
    selectedDate,
    weekDate,
    context.url,
    context.token,
    storeId,
    storeNumber,
  ]);

  return itemsLoading;
};

/** The counterpart store's cached weeks under this key, if they were fetched already. */
export const useCounterpartCache = (cacheKey: string) =>
  useAppSelector((state) => state.dev.salesCache.counterpart[cacheKey]);

/**
 * The counterpart store's three weeks of departments, for the store-against-
 * store report, narrowed exactly as the open store's were (to the matching
 * days, or to the one day picked in the strip above).
 *
 * No local copy: the cache IS the state, so coming back from an investigation
 * does not re-ask for three weeks that have not changed. `theirs` is undefined
 * until they arrive.
 */
export const useCounterpartSubs = (args: {
  compareStoreId: number;
  /** Co-located stores share a storeid, so the rows are narrowed by number
   *  as well. */
  compareStoreNumber: string;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
  lwWeekDates: string[];
  lyWeekDates: string[];
}) => {
  const {
    compareStoreId,
    compareStoreNumber,
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    lyStart,
    lyEnd,
    lwWeekDates,
    lyWeekDates,
  } = args;
  // A day picked in the strip above narrows both sides to that day. The open
  // store's departments arrive already narrowed; without this the counterpart
  // stayed a whole week, and one Friday was "behind" a week.
  const { selectedDate, url, token } = useSalesCtx();
  const dispatch = useAppDispatch();

  const cacheKey = [
    compareStoreId,
    compareStoreNumber,
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    lyStart,
    lyEnd,
  ].join("|");
  const cached = useCounterpartCache(cacheKey);

  /** The cache holds the counterpart's whole weeks; this narrows them exactly
   *  as the open store's were narrowed, so picking a day costs no request. */
  const lwKey = lwWeekDates.join(",");
  const lyKey = lyWeekDates.join(",");
  const theirs = useMemo(() => {
    if (!cached) return undefined;
    if (selectedDate) {
      const lwDay = shiftIso(selectedDate, -7);
      const lyDay = sameWeekDayLastYear(selectedDate).date;
      return {
        tw: cached.tw.filter((s) => day(s.sale_date) === selectedDate),
        lw: cached.lw.filter((s) => day(s.sale_date) === lwDay),
        ly: cached.ly.filter((s) => day(s.sale_date) === lyDay),
      };
    }
    const lwSet = new Set(lwKey.split(","));
    const lySet = new Set(lyKey.split(","));
    return {
      tw: cached.tw,
      lw: cached.lw.filter((s) => lwSet.has(day(s.sale_date))),
      ly: cached.ly.filter((s) => lySet.has(day(s.sale_date))),
    };
  }, [cached, selectedDate, lwKey, lyKey]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cached) return;
    let live = true;
    setFailed(false);
    const ask = (from: string, to: string) =>
      getSubsDaily(url, token, from, to, 0, compareStoreId);

    Promise.all([ask(twStart, twEnd), ask(lwStart, lwEnd), ask(lyStart, lyEnd)])
      .then(([tw, lw, ly]) => {
        if (!live) return;
        // The house convention is a 200 carrying `error`, so `error === 0` is
        // the success test. Scoped by store NUMBER: co-located stores share
        // an id.
        const take = (resp: { data: { error: number; subs: SubSale[] } }) =>
          resp.data.error === 0
            ? scopeToStoreNumber(resp.data.subs, compareStoreNumber)
            : [];
        dispatch(
          rememberCounterpart({
            key: cacheKey,
            value: { tw: take(tw), lw: take(lw), ly: take(ly) },
          }),
        );
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [
    url,
    token,
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    lyStart,
    lyEnd,
    compareStoreId,
    compareStoreNumber,
    cacheKey,
    cached,
    dispatch,
  ]);

  return { theirs, failed };
};
