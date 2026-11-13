// Hooks
import { useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";

// Utils
import { getStoreName } from "../../../../utils";
import {
  buildTransactionLengths,
  buildSignals,
  buildTotals,
} from "../utils";

export const useCashierCtx = () => {
  const dispatch = useAppDispatch();
  const { url, miktoUrl, apiKey, token, isMobile } = useAppSelector(
    (state) => state.app,
  );
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
    storeNameFilter,
    cashNameFilterApplied,
    storeNameFilterApplied,
    totalSalesFilterApplied,
    totalQtyFilterApplied,
    applyFilters,
    exceptionTierFilterApplied,
    riskLevelFilterApplied,
    filteredCashierCards,
    filteredStoreCards,
    exceptionQtyTypes,
    exceptionSalesTypes,
    transList,
    exportModalOpen,
    noRowsFound,
    fetchingTransactions,
    transCashNameFilter,
    transDateFilter,
    transDescFilter,
    transUpcFilter,
    transTotalSalesFilter,
    transFilterModalOpen,
    selectedTransFilter,
    applyTransFilters,
    filteredTransList,
    noStoresFound,
    transOverviews,
    filteredTransOverviews,
    transTotalQtyFilter,
    transactionLoadingMessage,
    transDrillDown,
    noTransactions,
    selectedSaleType,
  } = useCashiersState();
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector(
    (state) => state.search,
  );
  const { userid } = useAppSelector((state) => state.user);

  return {
    apiKey,
    applyFilters,
    cashierCards,
    cashierFilterModalOpen,
    cashierFilterType,
    cashierNameFilter,
    cashNameFilterApplied,
    exportModalOpen,
    storeNameFilterApplied,
    totalSalesFilterApplied,
    totalQtyFilterApplied,
    exceptionSalesTypes,
    exceptionTierFilterApplied,
    exceptionQtyTypes,
    filteredTransOverviews,
    riskLevelFilterApplied,
    cashiers,
    dataView,
    dispatch,
    endDate,
    exceptionTierFilter,
    filteredCashierCards,
    filteredStoreCards,
    lastGroup,
    lastStore,
    loadingCashiers,
    loadingStores,
    miktoUrl,
    riskLevelFilter,
    selectedStoreCard,
    startDate,
    storeCards,
    storeNameFilter,
    stores,
    token,
    totalSalesFilter,
    totalQtyFilter,
    transList,
    type,
    url,
    userid,
    noRowsFound,
    fetchingTransactions,
    transCashNameFilter,
    transDateFilter,
    transDescFilter,
    transUpcFilter,
    transTotalSalesFilter,
    transFilterModalOpen,
    selectedTransFilter,
    applyTransFilters,
    filteredTransList,
    noStoresFound,
    transOverviews,
    transTotalQtyFilter,
    transactionLoadingMessage,
    transDrillDown,
    noTransactions,
    selectedSaleType,
    isMobile,
  };
};

export const useCashiersState = () =>
  useAppSelector((state) => state.dev.cashier);

/**
 * The explorer's derived state (exception rows, transaction lengths, totals,
 * signals) from the slice, shared by desktop and mobile so they agree.
 */
export const useCashierSignals = () => {
  const { explorerAllRows, explorerFetchedException, explorerLens } =
    useAppSelector((s) => s.dev.cashier);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);

  const transactionLengths = useMemo(
    () => buildTransactionLengths(explorerAllRows),
    [explorerAllRows],
  );

  // transaction_list hands back whole receipts, so the signal maths has to run
  // on just the lines matching the exception the user picked.
  const exceptionRows = useMemo(
    () =>
      explorerAllRows.filter((r) => r.sale_type === explorerFetchedException),
    [explorerAllRows, explorerFetchedException],
  );

  const totals = useMemo(() => buildTotals(exceptionRows), [exceptionRows]);

  const signals = useMemo(
    () =>
      buildSignals(exceptionRows, transactionLengths, explorerLens, (id, fb) =>
        getStoreName(assignedStores, id, fb),
      ),
    [exceptionRows, transactionLengths, explorerLens, assignedStores],
  );

  return { exceptionRows, transactionLengths, totals, signals };
};
