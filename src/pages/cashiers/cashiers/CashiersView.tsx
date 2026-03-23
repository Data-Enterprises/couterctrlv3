import { useEffect } from "react";
import { useCashierCtx } from "..";
import { useAppDispatch } from "../../../hooks";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import CashierOverview from "./CashierOverview";
import { setApplyFilters, setFilteredCashierCards } from "../../../features/cashiersSlice";

const CashiersView = () => {
  const ctx = useCashierCtx();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (ctx.applyFilters) {
      const cashName = ctx.cashNameFilterApplied;
      const totalSales = ctx.totalSalesFilterApplied;
      const totalQty = ctx.totalQtyFilterApplied;
      const totalTrans = ctx.totalTransactionsFilterApplied;
      const riskLvl = ctx.riskLevelFilterApplied;
      const excTier = ctx.exceptionTierFilterApplied;

      const filtered = ctx.cashierCards.filter((card) => {
        const matchesCashierName = cashName.length
          ? card.cashier_name.toLowerCase().includes(cashName.toLowerCase())
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
          matchesCashierName &&
          matchesTotalSales &&
          matchesTotalQty &&
          matchesTotalTrans &&
          matchesRiskLvl &&
          matchesExcTier
        );
      });
      dispatch(setFilteredCashierCards(filtered));
      dispatch(setApplyFilters(false));
    }
  }, [
    ctx.applyFilters,
    ctx.cashNameFilterApplied,
    ctx.totalSalesFilterApplied,
    ctx.totalQtyFilterApplied,
    ctx.totalTransactionsFilterApplied,
    ctx.riskLevelFilterApplied,
    ctx.exceptionTierFilterApplied,
  ]);


  if (ctx.loadingCashiers) {
    return (
      <div className="relative h-[calc(100vh-5rem)]">
        <LoadingIndicator message="Loading stores..." />
      </div>
    );
  }
  return (
    <div className="min-h-full grid grid-cols-3 gap-2">
      {ctx.filteredCashierCards.map((card, i) => (
        <CashierOverview key={i} cashier={card} />
      ))}
    </div>
  );
};

export default CashiersView;
