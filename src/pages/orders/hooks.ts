import { useAppSelector, useAppDispatch } from "../../hooks";

export const useOrdersCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector((state) => state.search);
  const { assignedStores, userid } = useAppSelector((state) => state.user);
  const {
    availableOrders,
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
  } = useAppSelector((state) => state.orders);

  return {
    dispatch,
    assignedStores,
    availableOrders,
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
    orderTypeFilter,
    selectedAvailableOrder,
    selectedStoreIds,
    startDate,
    subDeptFilter,
    token,
    type,
    url,
    userid,
    filteredAvailableOrders,
    typeFilterArr,
  };
};
