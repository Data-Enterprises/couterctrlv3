import { useAppSelector, useAppDispatch } from "../../../hooks";

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
  };
};
