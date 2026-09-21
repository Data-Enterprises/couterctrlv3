import { useAppSelector, useAppDispatch } from "../../../hooks";

export const useOrdersCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isMobile } = useAppSelector((state) => state.app);
  const { startDate, endDate, type, lastStore, lastGroup, selectedGroup, selectedStore } = useAppSelector(
    (state) => state.search,
  );
  const { assignedStores, userid, selectedGroupStores } = useAppSelector((state) => state.user);
  const ordersState = useAppSelector((state) => state.prod.orders);
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
    isMobile,
  };
};
