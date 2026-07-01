import { useEffect } from "react";
import { useCashierCtx } from "..";
import { useAppDispatch } from "../../../../hooks";

import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import StoreOverview from "./StoreOverview";
import {
  setApplyFilters,
  setFilteredStoreCards,
  type NumberFilter,
} from "../../../../features/cashiersLegacySlice";
import type { ExceptionType, StoreCard } from "../../../../interfaces";

const StoresView = () => {
  const ctx = useCashierCtx();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (ctx.applyFilters) {
      const storeName = ctx.storeNameFilterApplied;
      const totalSales = ctx.totalSalesFilterApplied;
      const totalQty = ctx.totalQtyFilterApplied;
      const riskLvl = ctx.riskLevelFilterApplied;
      const excTier = ctx.exceptionTierFilterApplied;

      const salesTypes = ctx.exceptionSalesTypes;
      const qtyTypes = ctx.exceptionQtyTypes;

      const handleThreshold = (
        card: StoreCard,
        exc: ExceptionType,
        filter: NumberFilter,
        metric: "sales" | "qty",
      ) => {
        const formattedKey = `${exc
          .toLowerCase()
          .replace(/\s/g, "_")}_${metric}` as keyof StoreCard;

        if (filter.operator === ">") {
          // greater than
          return (card[formattedKey] as number) > filter.value;
        } else if (filter.operator === "<") {
          // less than
          return (card[formattedKey] as number) < filter.value;
        } else if (filter.operator === "=") {
          // equal to
          return (card[formattedKey] as number) === filter.value;
        }
        return false;
      };

      const filtered = ctx.storeCards.filter((card) => {
        const matchesStoreName = storeName.length
          ? card.store_name.toLowerCase().includes(storeName.toLowerCase())
          : true;

        const salesOperator = totalSales.operator.length > 0;
        const qtyOperator = totalQty.operator.length > 0;

        const adjustmetSalesMatch =
          salesTypes.includes("Adjustment") && salesOperator
            ? handleThreshold(card, "Adjustment", totalSales, "sales")
            : true;
        const adjustmentQtyMatch =
          qtyTypes.includes("Adjustment") && qtyOperator
            ? handleThreshold(card, "Adjustment", totalQty, "qty")
            : true;

        const backupSalesMatch =
          salesTypes.includes("Backup") && salesOperator
            ? handleThreshold(card, "Backup", totalSales, "sales")
            : true;
        const backupQtyMatch =
          qtyTypes.includes("Backup") && qtyOperator
            ? handleThreshold(card, "Backup", totalQty, "qty")
            : true;

        const cancelledSalesMatch =
          salesTypes.includes("Cancelled") && salesOperator
            ? handleThreshold(card, "Cancelled", totalSales, "sales")
            : true;
        const cancelledQtyMatch =
          qtyTypes.includes("Cancelled") && qtyOperator
            ? handleThreshold(card, "Cancelled", totalQty, "qty")
            : true;

        const handKeySalesMatch =
          salesTypes.includes("Hand Key") && salesOperator
            ? handleThreshold(card, "Hand Key", totalSales, "sales")
            : true;
        const handKeyQtyMatch =
          qtyTypes.includes("Hand Key") && qtyOperator
            ? handleThreshold(card, "Hand Key", totalQty, "qty")
            : true;

        const modifiedSalesMatch =
          salesTypes.includes("Modified") && salesOperator
            ? handleThreshold(card, "Modified", totalSales, "sales")
            : true;
        const modifiedQtyMatch =
          qtyTypes.includes("Modified") && qtyOperator
            ? handleThreshold(card, "Modified", totalQty, "qty")
            : true;

        const noSaleSalesMatch =
          salesTypes.includes("No Sale") && salesOperator
            ? handleThreshold(card, "No Sale", totalSales, "sales")
            : true;
        const noSaleQtyMatch =
          qtyTypes.includes("No Sale") && qtyOperator
            ? handleThreshold(card, "No Sale", totalQty, "qty")
            : true;

        const refundedSalesMatch =
          salesTypes.includes("Refunded") && salesOperator
            ? handleThreshold(card, "Refunded", totalSales, "sales")
            : true;
        const refundedQtyMatch =
          qtyTypes.includes("Refunded") && qtyOperator
            ? handleThreshold(card, "Refunded", totalQty, "qty")
            : true;

        const voidedSalesMatch =
          salesTypes.includes("Voided") && salesOperator
            ? handleThreshold(card, "Voided", totalSales, "sales")
            : true;
        const voidedQtyMatch =
          qtyTypes.includes("Voided") && qtyOperator
            ? handleThreshold(card, "Voided", totalQty, "qty")
            : true;

        const matchesRiskLvl = riskLvl.length
          ? card.risk_tier.toLowerCase() === riskLvl.toLowerCase()
          : true;

        const matchesExcTier = excTier.length
          ? card.exception_tier.toLowerCase().includes(excTier.toLowerCase())
          : true;

        return (
          matchesStoreName &&
          matchesRiskLvl &&
          matchesExcTier &&
          adjustmetSalesMatch &&
          adjustmentQtyMatch &&
          backupSalesMatch &&
          backupQtyMatch &&
          cancelledSalesMatch &&
          cancelledQtyMatch &&
          handKeySalesMatch &&
          handKeyQtyMatch &&
          modifiedSalesMatch &&
          modifiedQtyMatch &&
          noSaleSalesMatch &&
          noSaleQtyMatch &&
          refundedSalesMatch &&
          refundedQtyMatch &&
          voidedSalesMatch &&
          voidedQtyMatch
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

  if (ctx.noStoresFound) {
    return (
      <div className="h-full w-full flex justify-center items-center text-content/60 font-medium">
        <div className="bg-custom-white px-4 py-8 rounded-lg shadow-lg">No stores found in this date range</div>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
      {ctx.filteredStoreCards.map((card, i) => (
        <StoreOverview key={i} store={card} />
      ))}
    </div>
  );
};

export default StoresView;
