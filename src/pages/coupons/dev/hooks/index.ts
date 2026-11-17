// Hooks
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import * as couponActions from "../../../../features/dev/devCouponSlice";
import { setSelectedGroupStores } from "../../../../features/userSlice";
import { isGroupSearch } from "../../../../features/searchSlice";

// API
import { getCoupons } from "../../../../api/coupons";
import { getStoresAssignedToUserGroup } from "../../../../api/groups";

// Utils
import { formatGoliathDate } from "../../../../utils";

// Interfaces
import type { CouponsResponse, JsonError } from "../../../../interfaces";

/** Coupons' flat context: the slice, the search and the app values every part reads. */
export const useCouponContext = () => {
  const dispatch = useAppDispatch();
  const { coupons, isFetching, noCouponsFound, receiptLines, gridFilters } =
    useAppSelector((state) => state.dev.coupons);
  const { startDate, endDate, type, lastStore, lastGroup, selectedGroup } =
    useAppSelector((state) => state.search);
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
    selectedGroup,
    selectedGroupStores,
    assignedStores,
    userid,
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
    dispatch(couponActions.setCoupons([]));
    dispatch(couponActions.setIsFetching(true));
    // Cleared on every search: leaving it set means a later failure shows
    // this notice describing the *previous* search alongside the error toast.
    dispatch(couponActions.setNoCouponsFound(false));
    // A group search can return stores this user isn't assigned to; loading
    // them here lets those rows' store names resolve.
    if (isGroupSearch(ctx.type)) {
      getStoresAssignedToUserGroup(
        ctx.url,
        ctx.token,
        ctx.userid,
        ctx.lastGroup,
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
    const useGroups = isGroupSearch(ctx.type) ? 1 : 0;
    const singleStore = ctx.type === "Store" ? 1 : 0;
    const searchValue = isGroupSearch(ctx.type) ? ctx.lastGroup : ctx.lastStore;
    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);

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
