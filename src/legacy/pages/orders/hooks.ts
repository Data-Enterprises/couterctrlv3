import { useAppDispatch } from "../../../hooks/index";
import { useLegacySelector as useAppSelector } from "../../hooks";

export const useOrdersCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isTablet, isMobile } = useAppSelector((state) => state.app);
  const { startDate, endDate, type, lastStore, lastGroup, selectedGroup, selectedStore } = useAppSelector(
    (state) => state.search,
  );
  const { assignedStores, userid, selectedGroupStores } = useAppSelector((state) => state.user);
  // This used to pick between the new Orders slice and the legacy one on
  // devMode. In this tree there is nothing to pick: legacy Orders reads the
  // legacy slice, and the newer slice is not mounted here at all.
  const ordersState = useAppSelector((state) => state.ordersLegacy);
  const {
    availableOrders,
    groupedAvailableOrders,
    selectedOrderKey,
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
