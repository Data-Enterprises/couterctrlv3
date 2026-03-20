import { useAppSelector, useAppDispatch } from "../../hooks";

export const useCashierCtx = () => {
  const dispatch = useAppDispatch();
  const { url, miktoUrl, apiKey, token } = useAppSelector((state) => state.app);
  const {
    storeCards,
    cashierCards,
    stores,
    cashiers,
    selectedStoreCard,
    dataView,
    loadingStores,
    loadingCashiers,
    cashierFilterType,
    cashierFilterModalOpen,
    cashierNameFilter,
    exceptionTierFilter,
    riskLevelFilter,
    totalSalesFilter,
    totalQtyFilter,
    totalTransactionsFilter,
    storeFilterText,
    storeNameFilter,
  } = useAppSelector((state) => state.cashier);
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector(
    (state) => state.search,
  );
  const { userid } = useAppSelector((state) => state.user);

  return {
    apiKey,
    cashierCards,
    cashierFilterModalOpen,
    cashierFilterType,
    cashierNameFilter,
    cashiers,
    dataView,
    dispatch,
    endDate,
    exceptionTierFilter,
    lastGroup,
    lastStore,
    loadingCashiers,
    loadingStores,
    miktoUrl,
    riskLevelFilter,
    selectedStoreCard,
    startDate,
    storeCards,
    storeFilterText,
    storeNameFilter,
    stores,
    token,
    totalSalesFilter,
    totalTransactionsFilter,
    totalQtyFilter,
    type,
    url,
    userid,
  };
};
