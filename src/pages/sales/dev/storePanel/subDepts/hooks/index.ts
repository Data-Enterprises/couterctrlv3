// Hooks
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";

// Redux
import {
  setSelectedSubDeptItems,
  setInactiveSubDeptItems,
  setLastFetchedItemsKey,
} from "../../../../../../features/dev/devSalesLedgerSlice";

// Utils
import {
  addDays,
  formatGoliathDate,
  sameWeekDayLastYear,
} from "../../../../../../utils";
import { fetchSubDeptRowsSafe } from "../../../../../../utils/marginRows";
import { aggregateByCode, matchItemRows } from "../../../../../../utils/itemGrading";
import { scopeToStoreNumber, withProductCode } from "../../../utils/ledgerUtils";

// Interfaces
import type { SubDeptMargin } from "../../../../../../interfaces";

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
  const search = useAppSelector((state) => state.search);
  const {
    selectedDate,
    selectedSubDeptId: selectedId,
    lastFetchedItemsKey,
  } = useSalesCtx();
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    if (selectedId === null) {
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
    const itemsKey = `${storeId}__${storeNumber}_${selectedId}_${selectedDate ?? "all"}`;
    if (lastFetchedItemsKey === itemsKey) return;
    // The guard above lands only once the three calls have come back, so
    // StrictMode's second mount read the state the first had not written yet
    // and asked for all three again.
    if (inFlightItems.has(itemsKey)) return;
    inFlightItems.add(itemsKey);

    const twEnd = formatGoliathDate(search.singleDate);
    const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
    const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
    const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
    const lyWeekDates = twRealDates
      .map((d) => sameWeekDayLastYear(d).date)
      .sort();
    const lyStart = lyWeekDates[0] ?? lwEnd;
    const lyEnd = lyWeekDates[lyWeekDates.length - 1] ?? lwEnd;
    const lwWeekDates = twRealDates.map(
      (d) => addDays(new Date(d), -7).toISOString().split("T")[0],
    );

    const tyStart = selectedDate ?? twStart;
    const tyEnd = selectedDate ?? twEnd;
    const lwDayStart = selectedDate
      ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
      : lwStart;
    const lwDayEnd = selectedDate
      ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
      : lwEnd;
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
            selectedId,
            tyStart,
            tyEnd,
            0,
            storeId,
            1,
          ),
          fetchSubDeptRowsSafe(
            context.url,
            context.token,
            selectedId,
            lwDayStart,
            lwDayEnd,
            0,
            storeId,
            1,
          ),
          fetchSubDeptRowsSafe(
            context.url,
            context.token,
            selectedId,
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
        const tyItems: SubDeptMargin[] = withProductCode(
          scopeToStoreNumber(tyRaw, storeNumber),
        );
        let lwItems: SubDeptMargin[] = withProductCode(
          scopeToStoreNumber(lwRaw, storeNumber),
        );
        let lyItems: SubDeptMargin[] = withProductCode(
          scopeToStoreNumber(lyRaw, storeNumber),
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
    selectedId,
    selectedDate,
    search.singleDate,
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
