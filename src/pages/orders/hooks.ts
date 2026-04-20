import { useAppSelector, useAppDispatch } from "../../hooks";

export const useOrdersCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { startDate, endDate } = useAppSelector((state) => state.search);
  const {
    availableOrders,
    allOrders,
    orderTypeFilter,
    subDeptFilter,
    filteredOrders,
    selectedStoreIds,
  } = useAppSelector((state) => state.orders);

  return {
    dispatch,
    availableOrders,
    allOrders,
    endDate,
    filteredOrders,
    orderTypeFilter,
    selectedStoreIds,
    startDate,
    subDeptFilter,
    token,
    url,
  };
};
