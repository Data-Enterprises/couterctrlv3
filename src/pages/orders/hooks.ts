import { setCompanyForm } from "../../features/adminSlice";
import { useAppSelector, useAppDispatch } from "../../hooks";

export const useOrdersCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isTablet } = useAppSelector((state) => state.app);
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector(
    (state) => state.search,
  );
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
    orderStatusFilter,
    subIdsFilter,
    uniqueSubs,
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
  };
};

export const useFormActions = () => {
  const dispatch = useAppDispatch();

  const setName = (x: string) => {
    dispatch(setCompanyForm({ key: "name", val: x }));
  };

  const setAddress = (x: string) => {
    dispatch(setCompanyForm({ key: "address", val: x }));
  };

  const setCity = (x: string) => {
    dispatch(setCompanyForm({ key: "city", val: x }));
  };

  const setState = (x: string) => {
    dispatch(setCompanyForm({ key: "state", val: x }));
  };

  const setZip = (x: string) => {
    dispatch(setCompanyForm({ key: "zip", val: Number(x) }));
  };

  const setPhone = (x: string) => {
    dispatch(setCompanyForm({ key: "phone", val: x }));
  };

  const setContactEmail = (x: string) => {
    dispatch(setCompanyForm({ key: "contact_email", val: x }));
  };

  return {
    setName,
    setAddress,
    setCity,
    setState,
    setZip,
    setPhone,
    setContactEmail,
  };
};
