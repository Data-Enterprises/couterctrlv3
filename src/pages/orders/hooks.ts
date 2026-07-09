import { useAppSelector, useAppDispatch } from "../../hooks";
import type { RootState } from "../../store";

export const useOrdersCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isTablet, isMobile, devMode } = useAppSelector((state) => state.app);
  const { startDate, endDate, type, lastStore, lastGroup, selectedGroup, selectedStore } = useAppSelector(
    (state) => state.search,
  );
  const { assignedStores, userid, selectedGroupStores } = useAppSelector((state) => state.user);
  // Cast to the dev slice's shape: legacy Orders never reads the newer dev-only
  // fields (selectedOrderKey.storeids / selectedOrder), so the two slices'
  // structural differences there never surface at any actual legacy call site.
  const ordersState = useAppSelector(
    (state) => (devMode ? state.orders : state.ordersLegacy) as RootState["orders"],
  );
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
  } = ordersState;

  return {
    dispatch,
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
    url,
    userid,
    filteredAvailableOrders,
    typeFilterArr,
    isTablet,
    isMobile,
  };
};
