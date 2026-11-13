// Hooks
import { useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";

// Redux
import {
  clearOrderDrafts,
  openOrderDraft,
  setOrderDrafts,
  storeOrderDraft,
} from "../../../../features/dev/devOrdersSlice";

// Interfaces
import type { OrderDraft } from "../interfaces";

export const useOrdersCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isMobile } = useAppSelector((state) => state.app);
  const { startDate, endDate, type, lastStore, lastGroup, selectedGroup, selectedStore } = useAppSelector(
    (state) => state.search,
  );
  const { assignedStores, userid, selectedGroupStores, userLevel, companies } =
    useAppSelector((state) => state.user);
  const ordersState = useAppSelector((state) => state.dev.orders);
  const {
    availableOrders,
    groupedAvailableOrders,
    selectedOrderKey,
    selectedOrder,
    allOrders,
    orderTypeFilter,
    subDeptFilter,
    filteredOrders,
    selectedStoreIds,
    loadingAvailableOrders,
    availableOrderTypes,
    selectedAvailableOrder,
    ordersExportModalOpen,
    loadingAllOrders,
    orderFilters,
    filteredAvailableOrders,
    typeFilterArr,
    orderStatusFilter,
    subIdsFilter,
    uniqueSubs,
    filters,
    edit,
  } = ordersState;

  return {
    dispatch,
    userLevel,
    /** The company ids the signed-in user holds. `company` is the company,
     *  `id` is the link row — the Admin grid reads it the same way. */
    companyIds: companies.map((c) => c.company),
    assignedStores,
    selectedGroup,
    selectedGroupStores,
    selectedStore,
    availableOrders,
    groupedAvailableOrders,
    selectedOrderKey,
    selectedOrder,
    availableOrderTypes,
    allOrders,
    endDate,
    filteredOrders,
    lastGroup,
    lastStore,
    loadingAllOrders,
    loadingAvailableOrders,
    ordersExportModalOpen,
    orderFilters,
    orderStatusFilter,
    orderTypeFilter,
    selectedAvailableOrder,
    selectedStoreIds,
    startDate,
    subDeptFilter,
    subIdsFilter,
    token,
    type,
    uniqueSubs,
    filters,
    url,
    userid,
    filteredAvailableOrders,
    typeFilterArr,
    isMobile,
    /** Edit mode's working state: drafts, pickers, Problems tab, receipt. */
    edit,
  };
};

/**
 * Draft writes for edit mode.
 *
 * Each one reads the drafts as they are when it runs, the way a functional
 * setState did, so a lookup that lands late cannot undo edits made meanwhile.
 */
export const useOrderDraftActions = () => {
  const dispatch = useAppDispatch();
  return useMemo(
    () => ({
      /** Opens this order's draft, adding it if it is new. */
      openDraft: (draft: OrderDraft) => dispatch(openOrderDraft(draft)),
      /** Drops every draft, as a reloaded search needs. */
      clearDrafts: () => dispatch(clearOrderDrafts()),
      /** Edits one order's draft; a null result leaves it as it was. */
      editDraft: (
        key: string | null,
        fn: (d: OrderDraft | null) => OrderDraft | null,
      ) =>
        dispatch((_, getState) => {
          if (!key) return;
          const updated = fn(getState().dev.orders.edit.drafts[key] ?? null);
          if (updated) dispatch(storeOrderDraft(updated));
        }),
      /** Rewrites the whole set from what it is now. */
      editDrafts: (
        fn: (ds: Record<string, OrderDraft>) => Record<string, OrderDraft>,
      ) =>
        dispatch((_, getState) =>
          dispatch(setOrderDrafts(fn(getState().dev.orders.edit.drafts))),
        ),
    }),
    [dispatch],
  );
};
