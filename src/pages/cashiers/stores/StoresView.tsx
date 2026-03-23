import { useEffect } from "react";
import { useCashierCtx } from "..";
import { useAppDispatch } from "../../../hooks";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import StoreOverview from "./StoreOverview";
import {
  setApplyFilters,
  setFilteredStoreCards,
} from "../../../features/cashiersSlice";

const StoresView = () => {
  const ctx = useCashierCtx();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (ctx.applyFilters) {
      const storeName = ctx.storeNameFilterApplied;
      const totalSales = ctx.totalSalesFilterApplied;
      const totalQty = ctx.totalQtyFilterApplied;
      const totalTrans = ctx.totalTransactionsFilterApplied;
      const riskLvl = ctx.riskLevelFilterApplied;
      const excTier = ctx.exceptionTierFilterApplied;

      const filtered = ctx.storeCards.filter((card) => {
        const matchesStoreName = storeName.length
          ? card.store_name.toLowerCase().includes(storeName.toLowerCase())
          : true;

        const matchesTotalSales = totalSales.operator.length
          ? totalSales.operator === ">"
            ? card.total_sales > totalSales.value
            : totalSales.operator === "<"
              ? card.total_sales < totalSales.value
              : card.total_sales === totalSales.value
          : true;

        const matchesTotalQty = totalQty.operator.length
          ? totalQty.operator === ">"
            ? card.total_qty > totalQty.value
            : totalQty.operator === "<"
              ? card.total_qty < totalQty.value
              : card.total_qty === totalQty.value
          : true;

        const matchesTotalTrans = totalTrans.operator.length
          ? totalTrans.operator === ">"
            ? card.total_transactions > totalTrans.value
            : totalTrans.operator === "<"
              ? card.total_transactions < totalTrans.value
              : card.total_transactions === totalTrans.value
          : true;

        const matchesRiskLvl = riskLvl.length
          ? card.risk_tier.toLowerCase() === riskLvl.toLowerCase()
          : true;

        const matchesExcTier = excTier.length
          ? card.exception_tier.toLowerCase().includes(excTier.toLowerCase())
          : true;

        return (
          matchesStoreName &&
          matchesTotalSales &&
          matchesTotalQty &&
          matchesTotalTrans &&
          matchesRiskLvl &&
          matchesExcTier
        );
      });
      dispatch(setFilteredStoreCards(filtered));
      dispatch(setApplyFilters(false));
    }
  }, [
    ctx.applyFilters,
    ctx.storeNameFilterApplied,
    ctx.totalSalesFilterApplied,
    ctx.totalQtyFilterApplied,
    ctx.totalTransactionsFilterApplied,
    ctx.riskLevelFilterApplied,
    ctx.exceptionTierFilterApplied,
  ]);

  if (ctx.loadingStores) {
    return (
      <div className="relative h-[calc(100vh-5rem)]">
        <LoadingIndicator message="Loading stores..." />
      </div>
    );
  }

  return (
    <div className="min-h-full grid grid-cols-3 gap-2">
      {ctx.filteredStoreCards.map((card, i) => (
        <StoreOverview key={i} store={card} />
      ))}
    </div>
  );
};

export default StoresView;
