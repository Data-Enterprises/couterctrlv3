import { useEffect } from "react";
import { useCashierCtx } from "..";
import { useAppDispatch } from "../../../hooks";
import {
  setApplyFilters,
  setFilteredStoreCards,
  setSelectedStoreCard,
  type NumberFilter,
} from "../../../features/cashiersSlice";
import type { ExceptionType, StoreCard } from "../../../interfaces";
import { MagnifyingGlassIcon, ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/20/solid";

interface Props {
  onNewSearch: () => void;
}

type Tier = "critical" | "watch" | "healthy";

const toTier = (risk: string): Tier => {
  if (risk === "Low") return "healthy";
  if (risk === "Medium") return "watch";
  return "critical";
};

const SHADOW_COLOR: Record<Tier, string> = {
  critical: "rgba(239, 68, 68, 0.25)",
  watch:    "rgba(245, 158, 11, 0.25)",
  healthy:  "rgba(16, 185, 129, 0.25)",
};
const SELECTED_BG: Record<Tier, string> = {
  critical: "rgba(239,68,68,0.06)",
  watch:    "rgba(245,158,11,0.06)",
  healthy:  "rgba(16,185,129,0.06)",
};
const StoresView = ({ onNewSearch }: Props) => {
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

      const handleThreshold = (card: StoreCard, exc: ExceptionType, filter: NumberFilter, metric: "sales" | "qty") => {
        const formattedKey = `${exc.toLowerCase().replace(/\s/g, "_")}_${metric}` as keyof StoreCard;
        if (filter.operator === ">") return (card[formattedKey] as number) > filter.value;
        if (filter.operator === "<") return (card[formattedKey] as number) < filter.value;
        if (filter.operator === "=") return (card[formattedKey] as number) === filter.value;
        return false;
      };

      const filtered = ctx.storeCards.filter((card) => {
        const matchesStoreName = storeName.length ? card.store_name.toLowerCase().includes(storeName.toLowerCase()) : true;
        const salesOperator = totalSales.operator.length > 0;
        const qtyOperator = totalQty.operator.length > 0;
        const matchesRiskLvl = riskLvl.length ? card.risk_tier.toLowerCase() === riskLvl.toLowerCase() : true;
        const matchesExcTier = excTier.length ? card.exception_tier.toLowerCase().includes(excTier.toLowerCase()) : true;
        return (
          matchesStoreName && matchesRiskLvl && matchesExcTier &&
          (!salesTypes.includes("Adjustment") || !salesOperator || handleThreshold(card, "Adjustment", totalSales, "sales")) &&
          (!qtyTypes.includes("Adjustment") || !qtyOperator || handleThreshold(card, "Adjustment", totalQty, "qty")) &&
          (!salesTypes.includes("Backup") || !salesOperator || handleThreshold(card, "Backup", totalSales, "sales")) &&
          (!qtyTypes.includes("Backup") || !qtyOperator || handleThreshold(card, "Backup", totalQty, "qty")) &&
          (!salesTypes.includes("Cancelled") || !salesOperator || handleThreshold(card, "Cancelled", totalSales, "sales")) &&
          (!qtyTypes.includes("Cancelled") || !qtyOperator || handleThreshold(card, "Cancelled", totalQty, "qty")) &&
          (!salesTypes.includes("Hand Key") || !salesOperator || handleThreshold(card, "Hand Key", totalSales, "sales")) &&
          (!qtyTypes.includes("Hand Key") || !qtyOperator || handleThreshold(card, "Hand Key", totalQty, "qty")) &&
          (!salesTypes.includes("Modified") || !salesOperator || handleThreshold(card, "Modified", totalSales, "sales")) &&
          (!qtyTypes.includes("Modified") || !qtyOperator || handleThreshold(card, "Modified", totalQty, "qty")) &&
          (!salesTypes.includes("No Sale") || !salesOperator || handleThreshold(card, "No Sale", totalSales, "sales")) &&
          (!qtyTypes.includes("No Sale") || !qtyOperator || handleThreshold(card, "No Sale", totalQty, "qty")) &&
          (!salesTypes.includes("Refunded") || !salesOperator || handleThreshold(card, "Refunded", totalSales, "sales")) &&
          (!qtyTypes.includes("Refunded") || !qtyOperator || handleThreshold(card, "Refunded", totalQty, "qty")) &&
          (!salesTypes.includes("Voided") || !salesOperator || handleThreshold(card, "Voided", totalSales, "sales")) &&
          (!qtyTypes.includes("Voided") || !qtyOperator || handleThreshold(card, "Voided", totalQty, "qty"))
        );
      });
      dispatch(setFilteredStoreCards(filtered));
      dispatch(setApplyFilters(false));
    }
  }, [ctx.applyFilters, ctx.storeNameFilterApplied, ctx.totalSalesFilterApplied, ctx.totalQtyFilterApplied, ctx.riskLevelFilterApplied, ctx.exceptionTierFilterApplied]);

  const visible = ctx.filteredStoreCards;

  const critical = visible.filter((s) => toTier(s.risk_tier) === "critical");
  const watch    = visible.filter((s) => toTier(s.risk_tier) === "watch");
  const healthy  = visible.filter((s) => toTier(s.risk_tier) === "healthy");

  const StoreRow = ({ store }: { store: StoreCard }) => {
    const tier = toTier(store.risk_tier);
    const isSel = ctx.selectedStoreCard === store.storeid;
    return (
      <button
        onClick={() => dispatch(setSelectedStoreCard(store.storeid))}
        className="w-full flex flex-col px-3 py-2 border-b border-gray-100 transition-colors text-left hover:bg-gray-50"
        style={isSel ? { boxShadow: `inset 0 0 8px ${SHADOW_COLOR[tier]}`, background: SELECTED_BG[tier] } : undefined}
      >
        <div className="text-[11px] font-medium text-content truncate w-full">{store.store_name}</div>
        <div className="flex items-baseline gap-1 rounded px-1 py-0.5 mt-0.5 self-start" style={{ background: "rgba(30,42,74,0.06)", boxShadow: "inset 0 1px 2px rgba(30,42,74,0.08)" }}>
          <span className="text-[8px] text-content/50">Trans</span>
          <span className="text-[9px] font-semibold text-content">{store.total_transactions}</span>
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2.5" style={{ background: "#1e2a4a" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-white">Stores</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              {ctx.filteredStoreCards.length} locations
            </div>
          </div>
          <button
            onClick={onNewSearch}
            className="w-7 h-7 flex items-center justify-center rounded border transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }}
            aria-label="New search"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tier header strip */}
      <div className="flex-shrink-0 grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-red-50">
          <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#ef4444" }} />
          <span className="text-[10px] font-medium text-content/60 flex-1">Critical</span>
          <span className="text-[12px] font-semibold text-content">{critical.length}</span>
        </div>
        <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-amber-50">
          <ExclamationCircleIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
          <span className="text-[10px] font-medium text-content/60 flex-1">Watch</span>
          <span className="text-[12px] font-semibold text-content">{watch.length}</span>
        </div>
        <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-emerald-50">
          <CheckCircleIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10b981" }} />
          <span className="text-[10px] font-medium text-content/60 flex-1">Healthy</span>
          <span className="text-[12px] font-semibold text-content">{healthy.length}</span>
        </div>
      </div>

      {/* Three scrollable columns */}
      <div className="flex-1 min-h-0 grid grid-cols-3 divide-x divide-gray-100 overflow-hidden">
        <div className="overflow-y-auto thin-scrollbar">
          {critical.length === 0
            ? <div className="flex items-center justify-center h-12 text-[10px] text-content/30">None</div>
            : critical.map((s) => <StoreRow key={s.storeid} store={s} />)}
        </div>
        <div className="overflow-y-auto thin-scrollbar">
          {watch.length === 0
            ? <div className="flex items-center justify-center h-12 text-[10px] text-content/30">None</div>
            : watch.map((s) => <StoreRow key={s.storeid} store={s} />)}
        </div>
        <div className="overflow-y-auto thin-scrollbar">
          {healthy.length === 0
            ? <div className="flex items-center justify-center h-12 text-[10px] text-content/30">None</div>
            : healthy.map((s) => <StoreRow key={s.storeid} store={s} />)}
        </div>
      </div>
    </>
  );
};

export default StoresView;
