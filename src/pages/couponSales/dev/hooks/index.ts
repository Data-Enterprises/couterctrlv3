// Hooks
import { useMemo } from "react";
import { shallowEqual } from "react-redux";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import { setSelectedGroupStores } from "../../../../features/userSlice";
import {
  setCouponSalesData,
  setCouponSalesFetching,
  setCouponSalesHasSearched,
  setCouponSalesSearchedDate,
  setNoCouponSalesFound,
  reQueryCouponSales,
  COUPON_THRESHOLD_DEFAULT,
  COUPON_TREND_THRESHOLD_DEFAULT,
  setCouponBaseline,
} from "../../../../features/dev/devCouponSalesSlice";
import { isGroupSearch } from "../../../../features/searchSlice";

// API
import { getCoupons } from "../../../../api/coupons";
import { getStoresAssignedToUserGroup } from "../../../../api/groups";

// Utils
import { buildStoreRows, storeKeyOf, totalsFor, weekWindow } from "../utils";

// Interfaces
import type { CouponsResponse, JsonError } from "../../../../interfaces";

/** The Coupon Sales slice, the API connection, the search and the user's stores, read where they are used instead of passed down. */
export const useCouponSalesCtx = () => {
  const dispatch = useAppDispatch();
  const couponSales = useAppSelector((s) => s.dev.couponSales, shallowEqual);
  const { url, token, isMobile } = useAppSelector((s) => s.app);
  const userid = useAppSelector((s) => s.user.userid);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const groupStores = useAppSelector((s) => s.user.selectedGroupStores);
  const { singleDate, type, lastStore, lastGroup } = useAppSelector(
    (s) => s.search,
  );
  return {
    ...couponSales,
    dispatch,
    url,
    token,
    isMobile,
    userid,
    assignedStores,
    groupStores,
    singleDate,
    type,
    lastStore,
    lastGroup,
  };
};

/**
 * The week's search: the coupons for the picked week, and, beside them, the
 * two-week baseline they are graded against.
 */
export const useCouponSalesSearch = (
  ctx: ReturnType<typeof useCouponSalesCtx>,
) => {
  const toast = useToast();
  const {
    dispatch,
    url,
    token,
    userid,
    singleDate,
    type,
    lastStore,
    lastGroup,
  } = ctx;

  // The picker's week, for a new search.
  const { weekStart, weekEnd, baseStart, baseEnd } = useMemo(
    () => weekWindow(singleDate),
    [singleDate],
  );

  const getData = () => {
    dispatch(reQueryCouponSales());
    dispatch(setCouponSalesHasSearched(true));
    dispatch(setCouponSalesSearchedDate(singleDate));
    dispatch(setCouponSalesFetching(true));

    if (isGroupSearch(type)) {
      getStoresAssignedToUserGroup(url, token, userid, lastGroup)
        .then((resp) => {
          if (resp.data.error === 0) {
            dispatch(
              setSelectedGroupStores(
                resp.data.stores.filter((s: { active: boolean }) => s.active),
              ),
            );
          }
        })
        .catch(() => {});
    }

    const useGroups = isGroupSearch(type) ? 1 : 0;
    const singleStore = type === "Store" ? 1 : 0;
    const searchValue = isGroupSearch(type) ? lastGroup : lastStore;

    getCoupons(
      url,
      token,
      weekStart,
      weekEnd,
      useGroups,
      singleStore,
      searchValue,
    )
      .then((resp) => {
        const j: CouponsResponse = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Failed to load coupons");
        } else if (j.records.length > 0) {
          dispatch(setCouponSalesData(j.records));
        } else {
          dispatch(setNoCouponSalesFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setCouponSalesFetching(false)));

    // Baseline. Deliberately not awaited alongside the week — the page is
    // usable the moment the week lands, and rows simply grade as ungraded
    // until this arrives. A baseline failure is non-fatal for the same reason.
    dispatch(setCouponBaseline([]));
    getCoupons(
      url,
      token,
      baseStart,
      baseEnd,
      useGroups,
      singleStore,
      searchValue,
    )
      .then((resp) => {
        const j: CouponsResponse = resp.data;
        if (j.error === 0) dispatch(setCouponBaseline(j.records));
      })
      .catch(() => {});
  };

  return { getData };
};

/**
 * The page's grading: the store rows and totals for the list, and the picked
 * store's coupons and the baseline its breakdown is graded against.
 */
export const useCouponSalesGrading = (
  ctx: ReturnType<typeof useCouponSalesCtx>,
) => {
  const {
    coupons,
    baselineCoupons,
    threshold,
    trendThreshold,
    metric,
    selectedStoreKey,
    assignedStores,
    groupStores,
  } = ctx;

  // Grading holds the last valid amount while the numeric input is empty, so
  // clearing it never reshuffles the list out from under the user.
  const activeThreshold = threshold ?? COUPON_THRESHOLD_DEFAULT;
  const activeTrendThreshold = trendThreshold ?? COUPON_TREND_THRESHOLD_DEFAULT;

  // One object so every builder grades identically — see couponGrading.
  const grading = useMemo(
    () => ({
      metric,
      threshold: activeThreshold,
      trendThreshold: activeTrendThreshold,
      baseline: baselineCoupons,
    }),
    [metric, activeThreshold, activeTrendThreshold, baselineCoupons],
  );

  const storeRows = useMemo(
    () => buildStoreRows(coupons, grading, assignedStores, groupStores),
    [coupons, grading, assignedStores, groupStores],
  );

  const totals = useMemo(() => totalsFor(coupons), [coupons]);

  const storeCoupons = useMemo(
    () =>
      selectedStoreKey === null
        ? []
        : coupons.filter((c) => storeKeyOf(c) === selectedStoreKey),
    [coupons, selectedStoreKey],
  );

  // The detail panel grades sub depts, cashiers and dates WITHIN one store, so
  // its baseline has to be that store's slice of the baseline window — the
  // whole-search baseline would compare one store against every store.
  const storeGrading = useMemo(
    () => ({
      ...grading,
      baseline:
        selectedStoreKey === null
          ? []
          : baselineCoupons.filter((c) => storeKeyOf(c) === selectedStoreKey),
    }),
    [grading, baselineCoupons, selectedStoreKey],
  );

  return {
    activeThreshold,
    storeRows,
    totals,
    storeCoupons,
    selectedStore: storeRows.find((r) => r.key === selectedStoreKey),
    storeGrading,
  };
};
