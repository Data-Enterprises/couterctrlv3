import { useEffect } from "react";
import { useCashierCtx } from "..";
import { useAppDispatch } from "../../../hooks";
import { type NumberFilter } from "../../../features/cashiersSlice";
import { useCashiersActions } from "../hooks/useCashiersActions";
import type { CashierCard, ExceptionType } from "../../../interfaces";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";

interface Props {
  selectedCashier: CashierCard | null;
  onCashierSelect: (c: CashierCard) => void;
  onBackToStores: () => void;
}

type Tier = "critical" | "watch" | "healthy";

const toTier = (risk: string): Tier => {
  if (risk === "Low") return "healthy";
  if (risk === "Medium") return "watch";
  return "critical";
};

const SHADOW_COLOR: Record<Tier, string> = {
  critical: "rgba(239, 68, 68, 0.25)",
  watch: "rgba(245, 158, 11, 0.25)",
  healthy: "rgba(16, 185, 129, 0.25)",
};
const SELECTED_BG: Record<Tier, string> = {
  critical: "rgba(239,68,68,0.06)",
  watch: "rgba(245,158,11,0.06)",
  healthy: "rgba(16,185,129,0.06)",
};
const CashiersView = ({
  selectedCashier,
  onCashierSelect,
  onBackToStores,
}: Props) => {
  const ctx = useCashierCtx();
  const dispatch = useAppDispatch();
  const actions = useCashiersActions();

  useEffect(() => {
    if (ctx.applyFilters) {
      const cashName = ctx.cashNameFilterApplied;
      const totalSales = ctx.totalSalesFilterApplied;
      const totalQty = ctx.totalQtyFilterApplied;
      const riskLvl = ctx.riskLevelFilterApplied;
      const excTier = ctx.exceptionTierFilterApplied;
      const salesTypes = ctx.exceptionSalesTypes;
      const qtyTypes = ctx.exceptionQtyTypes;

      const handleThreshold = (
        card: CashierCard,
        exc: ExceptionType,
        filter: NumberFilter,
        metric: "sales" | "qty",
      ) => {
        const formattedKey =
          `${exc.toLowerCase().replace(/\s/g, "_")}_${metric}` as keyof CashierCard;
        if (filter.operator === ">")
          return (card[formattedKey] as number) > filter.value;
        if (filter.operator === "<")
          return (card[formattedKey] as number) < filter.value;
        if (filter.operator === "=")
          return (card[formattedKey] as number) === filter.value;
        return false;
      };

      const salesOp = totalSales.operator.length > 0;
      const qtyOp = totalQty.operator.length > 0;

      const filtered = ctx.cashierCards.filter((card) => {
        const matchName = cashName.length
          ? card.store_name.toLowerCase().includes(cashName.toLowerCase())
          : true;
        const matchRisk = riskLvl.length
          ? card.risk_tier.toLowerCase() === riskLvl.toLowerCase()
          : true;
        const matchExc = excTier.length
          ? card.exception_tier.toLowerCase().includes(excTier.toLowerCase())
          : true;
        return (
          matchName &&
          matchRisk &&
          matchExc &&
          (!salesTypes.includes("Adjustment") ||
            !salesOp ||
            handleThreshold(card, "Adjustment", totalSales, "sales")) &&
          (!qtyTypes.includes("Adjustment") ||
            !qtyOp ||
            handleThreshold(card, "Adjustment", totalQty, "qty")) &&
          (!salesTypes.includes("Backup") ||
            !salesOp ||
            handleThreshold(card, "Backup", totalSales, "sales")) &&
          (!qtyTypes.includes("Backup") ||
            !qtyOp ||
            handleThreshold(card, "Backup", totalQty, "qty")) &&
          (!salesTypes.includes("Cancelled") ||
            !salesOp ||
            handleThreshold(card, "Cancelled", totalSales, "sales")) &&
          (!qtyTypes.includes("Cancelled") ||
            !qtyOp ||
            handleThreshold(card, "Cancelled", totalQty, "qty")) &&
          (!salesTypes.includes("Hand Key") ||
            !salesOp ||
            handleThreshold(card, "Hand Key", totalSales, "sales")) &&
          (!qtyTypes.includes("Hand Key") ||
            !qtyOp ||
            handleThreshold(card, "Hand Key", totalQty, "qty")) &&
          (!salesTypes.includes("Modified") ||
            !salesOp ||
            handleThreshold(card, "Modified", totalSales, "sales")) &&
          (!qtyTypes.includes("Modified") ||
            !qtyOp ||
            handleThreshold(card, "Modified", totalQty, "qty")) &&
          (!salesTypes.includes("No Sale") ||
            !salesOp ||
            handleThreshold(card, "No Sale", totalSales, "sales")) &&
          (!qtyTypes.includes("No Sale") ||
            !qtyOp ||
            handleThreshold(card, "No Sale", totalQty, "qty")) &&
          (!salesTypes.includes("Refunded") ||
            !salesOp ||
            handleThreshold(card, "Refunded", totalSales, "sales")) &&
          (!qtyTypes.includes("Refunded") ||
            !qtyOp ||
            handleThreshold(card, "Refunded", totalQty, "qty")) &&
          (!salesTypes.includes("Voided") ||
            !salesOp ||
            handleThreshold(card, "Voided", totalSales, "sales")) &&
          (!qtyTypes.includes("Voided") ||
            !qtyOp ||
            handleThreshold(card, "Voided", totalQty, "qty"))
        );
      });
      dispatch(actions.setFilteredCashierCards(filtered));
      dispatch(actions.setApplyFilters(false));
    }
  }, [
    ctx.applyFilters,
    ctx.cashNameFilterApplied,
    ctx.totalSalesFilterApplied,
    ctx.totalQtyFilterApplied,
    ctx.riskLevelFilterApplied,
    ctx.exceptionTierFilterApplied,
  ]);

  const storeName =
    ctx.storeCards.find((s) => s.storeid === ctx.selectedStoreCard)
      ?.store_name ?? "";

  const visible = ctx.filteredCashierCards;

  const critical = visible.filter((c) => toTier(c.risk_tier) === "critical");
  const watch = visible.filter((c) => toTier(c.risk_tier) === "watch");
  const healthy = visible.filter((c) => toTier(c.risk_tier) === "healthy");

  const CashierRow = ({ cashier }: { cashier: CashierCard }) => {
    const tier = toTier(cashier.risk_tier);
    const isSel = selectedCashier?.cashier_number === cashier.cashier_number;
    return (
      <button
        onClick={() => onCashierSelect(cashier)}
        className="w-full flex flex-col px-3 py-2 border-b border-gray-100 transition-colors text-left hover:bg-gray-50"
        style={
          isSel
            ? {
                boxShadow: `inset 0 0 8px ${SHADOW_COLOR[tier]}`,
                background: SELECTED_BG[tier],
              }
            : undefined
        }
      >
        <div className="text-[11px] font-medium text-content truncate w-full">
          {cashier.cashier_name}
        </div>
        <div
          className="flex items-baseline gap-1 rounded px-1 py-0.5 mt-0.5 self-start"
          style={{
            background: "rgba(30,42,74,0.06)",
            boxShadow: "inset 0 1px 2px rgba(30,42,74,0.08)",
          }}
        >
          <span className="text-[8px] text-content/50">Trans</span>
          <span className="text-[9px] font-semibold text-content">
            {cashier.total_transactions}
          </span>
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 py-2.5"
        style={{ background: "#1e2a4a" }}
      >
        <div className="text-[13px] font-medium text-custom-white truncate">
          {storeName}
        </div>
        <div
          className="text-[10px] mt-0.5"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {ctx.filteredCashierCards.length} cashiers
        </div>
      </div>

      {/* Back link */}
      <button
        onClick={onBackToStores}
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-[10px] font-medium border-b border-gray-100 hover:bg-gray-50 transition-colors"
        style={{ color: "#1e2a4a" }}
      >
        <span>←</span> Back to stores
      </button>

      {ctx.loadingCashiers ? (
        <div className="flex-1 relative">
          <LoadingIndicator message="Loading cashiers…" />
        </div>
      ) : (
        <>
          {/* Tier header strip */}
          <div className="flex-shrink-0 grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-red-50">
              <ExclamationTriangleIcon
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: "#ef4444" }}
              />
              <span className="text-[10px] font-medium text-content/60 flex-1">
                Critical
              </span>
              <span className="text-[12px] font-semibold text-content">
                {critical.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-amber-50">
              <ExclamationCircleIcon
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: "#f59e0b" }}
              />
              <span className="text-[10px] font-medium text-content/60 flex-1">
                Watch
              </span>
              <span className="text-[12px] font-semibold text-content">
                {watch.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-emerald-50">
              <CheckCircleIcon
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: "#10b981" }}
              />
              <span className="text-[10px] font-medium text-content/60 flex-1">
                Healthy
              </span>
              <span className="text-[12px] font-semibold text-content">
                {healthy.length}
              </span>
            </div>
          </div>

          {/* Three scrollable columns */}
          <div className="flex-1 min-h-0 grid grid-cols-3 divide-x divide-gray-100 overflow-hidden">
            <div className="overflow-y-auto thin-scrollbar">
              {critical.length === 0 ? (
                <div className="flex items-center justify-center h-12 text-[10px] text-content/30">
                  None
                </div>
              ) : (
                critical.map((c) => (
                  <CashierRow key={c.cashier_number} cashier={c} />
                ))
              )}
            </div>
            <div className="overflow-y-auto thin-scrollbar">
              {watch.length === 0 ? (
                <div className="flex items-center justify-center h-12 text-[10px] text-content/30">
                  None
                </div>
              ) : (
                watch.map((c) => (
                  <CashierRow key={c.cashier_number} cashier={c} />
                ))
              )}
            </div>
            <div className="overflow-y-auto thin-scrollbar">
              {healthy.length === 0 ? (
                <div className="flex items-center justify-center h-12 text-[10px] text-content/30">
                  None
                </div>
              ) : (
                healthy.map((c) => (
                  <CashierRow key={c.cashier_number} cashier={c} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CashiersView;
