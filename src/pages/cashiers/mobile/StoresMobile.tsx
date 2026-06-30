import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useCashierCtx } from "..";
import type { StoreCard } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import SevChips from "../../sales/mobile/components/SevChips";
import type { SevFilter } from "../../../features/salesLedgerSlice";

interface Props {
  onStoreSelect: (store: StoreCard) => void;
  onOpenSearch: () => void;
}

const riskConfig = {
  Critical: { bg: "#fee2e2", color: "#991b1b" },
  Watch:    { bg: "#fef3c7", color: "#92400e" },
  Healthy:  { bg: "#d1fae5", color: "#065f46" },
} as const;

const chipStyle = {
  background: "rgba(30,42,74,0.06)",
  boxShadow: "inset 0 1px 2px rgba(30,42,74,0.08)",
};

const toTier = (risk_tier: string): "Critical" | "Watch" | "Healthy" => {
  if (risk_tier === "High" || risk_tier === "Very High") return "Critical";
  if (risk_tier === "Medium") return "Watch";
  return "Healthy";
};

const toSev = (risk_tier: string): SevFilter => {
  const t = toTier(risk_tier);
  if (t === "Critical") return "critical";
  if (t === "Watch") return "watch";
  return "healthy";
};

const StoresMobile = ({ onStoreSelect, onOpenSearch }: Props) => {
  const ctx = useCashierCtx();
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

  const counts: Record<SevFilter, number> = {
    all:      ctx.storeCards.length,
    critical: ctx.storeCards.filter((s) => toSev(s.risk_tier) === "critical").length,
    watch:    ctx.storeCards.filter((s) => toSev(s.risk_tier) === "watch").length,
    healthy:  ctx.storeCards.filter((s) => toSev(s.risk_tier) === "healthy").length,
  };

  const visible = sevFilter === "all"
    ? ctx.storeCards
    : ctx.storeCards.filter((s) => toSev(s.risk_tier) === sevFilter);

  const totalSales = visible.reduce((s, r) => s + r.total_sales, 0);
  const netSales   = visible.reduce((s, r) => s + r.net_sales, 0);
  const totalQty   = visible.reduce((s, r) => s + r.total_qty, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex-shrink-0">
        <div className="relative flex items-center justify-center mb-2">
          <div className="w-[22px] h-[22px] flex-shrink-0" />
          <div className="text-center px-8 flex-1">
            <div className="text-white font-medium text-[13px]">Stores</div>
            <div className="text-white/60 text-[10px] mt-0.5">{ctx.startDate} – {ctx.endDate}</div>
          </div>
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="absolute right-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        {!ctx.loadingStores && ctx.storeCards.length > 0 && (
          <div className="grid grid-cols-3 gap-1 mt-2">
            {[
              { label: "Total", value: formatCurrency2(totalSales) },
              { label: "Net",   value: formatCurrency2(netSales) },
              { label: "Qty",   value: totalQty.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="text-[10px] text-white/50">{label}</div>
                <div className="text-[12px] font-medium text-white mt-0.5 truncate">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tier filter chips */}
      {!ctx.loadingStores && ctx.storeCards.length > 0 && (
        <SevChips active={sevFilter} counts={counts} onChange={setSevFilter} />
      )}

      {/* Store list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {ctx.loadingStores && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">Loading stores…</div>
        )}
        {!ctx.loadingStores && ctx.noStoresFound && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">No stores found for this date range.</div>
        )}
        {!ctx.loadingStores && visible.length === 0 && !ctx.noStoresFound && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">No stores match filter.</div>
        )}
        {!ctx.loadingStores && visible.map((store) => {
          const tier = toTier(store.risk_tier);
          const rc = riskConfig[tier];
          return (
            <button
              key={store.storeid}
              onClick={() => onStoreSelect(store)}
              className="w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[13px] font-medium text-content truncate">{store.store_name}</div>
                <span className="text-[9px] font-medium px-2 py-0.5 rounded ml-3 flex-shrink-0" style={{ background: rc.bg, color: rc.color }}>
                  {store.risk_tier}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: "Total", value: formatCurrency2(store.total_sales) },
                  { label: "Net",   value: formatCurrency2(store.net_sales) },
                  { label: "Qty",   value: formatBigNumber(store.total_qty, 0) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
                    <span className="text-[9px] text-content/50">{label}</span>
                    <span className="text-[10px] font-semibold text-content">{value}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StoresMobile;
