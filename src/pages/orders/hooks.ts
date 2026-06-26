import { useAppSelector, useAppDispatch } from "../../hooks";

export const useOrdersCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isTablet, isMobile } = useAppSelector((state) => state.app);
  const { startDate, endDate, type, lastStore, lastGroup, selectedGroup, selectedStore } = useAppSelector(
    (state) => state.search,
  );
  const { assignedStores, userid, selectedGroupStores } = useAppSelector((state) => state.user);
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
  } = useAppSelector((state) => state.orders);

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
