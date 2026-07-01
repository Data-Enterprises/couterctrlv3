import { useAppSelector, useAppDispatch } from "../../hooks";

export const useOrdersCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isTablet, isMobile, devMode } = useAppSelector((state) => state.app);
  const { startDate, endDate, type, lastStore, lastGroup, selectedGroup, selectedStore } = useAppSelector(
    (state) => state.search,
  );
  const { assignedStores, userid, selectedGroupStores } = useAppSelector((state) => state.user);
  const ordersState = useAppSelector((state) => devMode ? state.orders : state.ordersLegacy);
  const {
    availableOrders,
    groupedAvailableOrders,
    selectedOrderKey,
    selectedOrderId,
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
    selectedOrderId,
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
