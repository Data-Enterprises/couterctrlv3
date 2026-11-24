// Hooks
import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import * as couponActions from "../../../../features/couponSlice";
import { setSelectedGroupStores } from "../../../../features/userSlice";
import { isGroupSearch } from "../../../../features/searchSlice";

// API
import { getCoupons } from "../../../../api/coupons";
import { getStoresAssignedToUserGroup } from "../../../../api/groups";

// Utils
import { formatGoliathDate } from "../../../../utils";
import {
  fmtNum,
  aggregateRows,
  type AggFn,
  type AggRow,
} from "../../../../utils/csvExport";
import { DIMS, METRICS } from "../utils";

// Interfaces
import type {
  CouponItem,
  CouponsResponse,
  JsonError,
} from "../../../../interfaces";
import type { MetricSelection } from "../interfaces";

/** Coupons' flat context: the slice, the search and the app values every part reads. */
export const useCouponContext = () => {
  const dispatch = useAppDispatch();
  const {
    coupons,
    isFetching,
    noCouponsFound,
    receiptLines,
    gridFilters,
    selectedKey,
    sortMetric,
    mobile,
    searched,
  } = useAppSelector((state) => state.prod.coupons);
  const liveSearch = useAppSelector((state) => state.search);
  // The search the loaded coupons answer, so the labels don't follow the
  // shared picker once it moves. Before the first search, the live one.
  const { startDate, endDate, type, lastStore, lastGroup, selectedGroup } =
    searched ?? liveSearch;
  const { selectedGroupStores, assignedStores, userid } = useAppSelector(
    (state) => state.user,
  );
  const { url, token, isMobile } = useAppSelector((state) => state.app);

  return {
    dispatch,
    url,
    token,
    coupons,
    startDate,
    endDate,
    type,
    lastStore,
    lastGroup,
    isFetching,
    noCouponsFound,
    isMobile,
    receiptLines,
    gridFilters,
    selectedKey,
    sortMetric,
    mobile,
    selectedGroup,
    selectedGroupStores,
    assignedStores,
    userid,
    /** The shared search card as it stands, for running a new search. */
    liveSearch,
  };
};

/**
 * Coupons' action creators.
 */
export const useCouponActions = () => couponActions;

/**
 * The coupons search, desktop and phone alike. `onLoaded` runs when records
 * come back, so a screen can move on in the same step the rows land.
 */
export const useCouponSearch = (ctx: ReturnType<typeof useCouponContext>) => {
  const toast = useToast();
  const { dispatch } = ctx;

  const runSearch = (onLoaded?: () => void) => {
    const search = ctx.liveSearch;
    dispatch(
      couponActions.setCouponSearched({
        type: search.type,
        startDate: search.startDate,
        endDate: search.endDate,
        lastStore: search.lastStore,
        lastGroup: search.lastGroup,
        selectedGroup: search.selectedGroup,
      }),
    );
    dispatch(couponActions.setCoupons([]));
    dispatch(couponActions.setIsFetching(true));
    // Cleared on every search: leaving it set means a later failure shows
    // this notice describing the *previous* search alongside the error toast.
    dispatch(couponActions.setNoCouponsFound(false));
    // A group search can return stores this user isn't assigned to; loading
    // them here lets those rows' store names resolve.
    if (isGroupSearch(search.type)) {
      getStoresAssignedToUserGroup(
        ctx.url,
        ctx.token,
        ctx.userid,
        search.lastGroup,
      )
        .then((resp) => {
          if (resp.data.error === 0) {
            dispatch(
              setSelectedGroupStores(
                resp.data.stores.filter((s: { active: boolean }) => s.active),
              ),
            );
          } else {
            toast.warn(resp.data.msg);
          }
        })
        .catch(() => {});
    }
    const useGroups = isGroupSearch(search.type) ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = isGroupSearch(search.type)
      ? search.lastGroup
      : search.lastStore;
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);

    getCoupons(
      ctx.url,
      ctx.token,
      start,
      end,
      useGroups,
      singleStore,
      searchValue,
    )
      .then((resp) => {
        const j: CouponsResponse = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Failed to load coupons");
        } else if (j.records.length > 0) {
          dispatch(couponActions.setCoupons(j.records));
          onLoaded?.();
        } else {
          dispatch(couponActions.setNoCouponsFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(couponActions.setIsFetching(false)));
  };

  return { runSearch };
};

/**
 * The export's choices and what they make: the stores ticked (multi-store
 * data only), the group-by fields and metrics, the rows they cover and the
 * Custom rows and columns. Nothing is picked to start with.
 */
export const useCouponExport = (rows: CouponItem[]) => {
  // No default selections
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["coupon_amount", { fn: "sum", enabled: false }],
      ["qty", { fn: "sum", enabled: false }],
    ]),
  );

  // Unique stores derived from rows
  const uniqueStores = useMemo(() => {
    const map = new Map<string, { name: string; number: string }>();
    rows.forEach((r) => {
      if (!map.has(r.store_number))
        map.set(r.store_number, {
          name: r.store_name ?? r.store_number,
          number: r.store_number,
        });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [rows]);

  const isMultiStore = uniqueStores.length > 1;

  // Selected stores — no default selections
  const [selectedStores, setSelectedStores] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleStore = (num: string) =>
    setSelectedStores((prev) => {
      const n = new Set(prev);
      n.has(num) ? n.delete(num) : n.add(num);
      return n;
    });

  // Rows filtered by selected stores
  const filteredRows = useMemo(
    () =>
      isMultiStore
        ? rows.filter((r) => selectedStores.has(r.store_number))
        : rows,
    [rows, selectedStores, isMultiStore],
  );

  const toggleGroupBy = (key: string) =>
    setGroupBy((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const toggleMetric = (key: string) =>
    setMetrics((prev) => {
      const n = new Map(prev);
      const c = n.get(key)!;
      n.set(key, { ...c, enabled: !c.enabled });
      return n;
    });

  const setMetricFn = (key: string, fn: AggFn) =>
    setMetrics((prev) => {
      const n = new Map(prev);
      const c = n.get(key)!;
      n.set(key, { ...c, fn });
      return n;
    });

  const flatRows = useMemo<AggRow[]>(
    () => filteredRows.map((r) => ({ ...r }) as unknown as AggRow),
    [filteredRows],
  );

  const { aggRows, columns } = useMemo(() => {
    const activeDims = DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = METRICS.map((m) => ({
      ...m,
      sel: metrics.get(m.key),
    }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const agg = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    const display = agg.map((row) => {
      const out: Record<string, string> = {};
      for (const d of activeDims) out[d.key] = String(row[d.key] ?? "");
      for (const m of activeMetrics) {
        const colKey = `${m.fn}__${m.key}`;
        const val = Number(row[colKey]);
        out[colKey] = m.fn === "count" ? String(Math.round(val)) : fmtNum(val);
      }
      return out;
    });

    const cols = [
      ...activeDims.map((d) => ({ key: d.key, label: d.label })),
      ...activeMetrics.map((m) => ({
        key: `${m.fn}__${m.key}`,
        label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}`,
      })),
    ];

    return { aggRows: display, columns: cols };
  }, [flatRows, groupBy, metrics]);

  return {
    uniqueStores,
    isMultiStore,
    selectedStores,
    setSelectedStores,
    toggleStore,
    filteredRows,
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    aggRows,
    columns,
  };
};
