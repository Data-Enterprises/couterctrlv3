import { MagnifyingGlassIcon, ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setCashierSaleIds, setSelectedCashier } from "../../../features/lossPreventionSlice";
import type { CashierDetails, CashierTrend } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";

type Severity = "critical" | "watch" | "healthy";

const SHADOW_COLOR: Record<Severity, string> = {
  critical: "rgba(239, 68, 68, 0.25)",
  watch:    "rgba(245, 158, 11, 0.25)",
  healthy:  "rgba(16, 185, 129, 0.25)",
};
const SELECTED_BG: Record<Severity, string> = {
  critical: "rgba(239,68,68,0.06)",
  watch:    "rgba(245,158,11,0.06)",
  healthy:  "rgba(16,185,129,0.06)",
};

const isNoDollarType = (saleType: string) =>
  saleType.toLowerCase().replace(/[^a-z]/g, "") === "nosale";

const storeSeverity = (detail: CashierDetails, trends: CashierTrend[], saleType: string): Severity => {
  const trend = trends.find((t) => t.storeid === detail.storeid);
  if (!trend) return "critical";

  if (isNoDollarType(saleType)) {
    const score = [
      detail.transaction_count < trend.transaction_count,
      detail.total_items       < trend.total_items,
    ].filter(Boolean).length;
    if (score === 2) return "healthy";
    if (score === 1) return "watch";
    return "critical";
  }

  const score = [
    detail.transaction_count < trend.transaction_count,
    detail.total_items       < trend.total_items,
    Math.abs(detail.amount)          < Math.abs(trend.amount),
    Math.abs(detail.average_dollars) < Math.abs(trend.average_dollars),
  ].filter(Boolean).length;
  if (score >= 3) return "healthy";
  if (score === 2) return "watch";
  return "critical";
};

const chipStyle = {
  background: "rgba(30,42,74,0.06)",
  boxShadow: "inset 0 1px 2px rgba(30,42,74,0.08)",
};

interface Props {
  loading: boolean;
  onSaleTypeSelect: (saleType: string) => void;
  onStoreSelect: (detail: CashierDetails) => void;
  onOpenSearch: () => void;
}

const LPStorePanel = ({ loading, onSaleTypeSelect, onStoreSelect, onOpenSearch }: Props) => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((s) => s.lossPrevention);
  const search = useAppSelector((s) => s.search);

  const {
    saleTypes, selectedSaleType, cashierDetails, cashierTrends,
    selectedStoreId, cashiers, selectedCashier,
  } = cashier;

  const dateLabel = `${search.startDate} – ${search.endDate}`;

  const criticalStores = cashierDetails.filter((d) => storeSeverity(d, cashierTrends, selectedSaleType) === "critical");
  const watchStores    = cashierDetails.filter((d) => storeSeverity(d, cashierTrends, selectedSaleType) === "watch");
  const healthyStores  = cashierDetails.filter((d) => storeSeverity(d, cashierTrends, selectedSaleType) === "healthy");

  const handleCashierClick = (cashier_number: number, store_number: string) => {
    if (cashier_number === selectedCashier.cashier_number && store_number === selectedCashier.store_number) {
      dispatch(setCashierSaleIds([]));
      dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
      return;
    }
    dispatch(setSelectedCashier({ cashier_number, store_number }));
  };

  const StoreRow = ({ detail }: { detail: CashierDetails }) => {
    const sev = storeSeverity(detail, cashierTrends, selectedSaleType);
    const isSel = detail.storeid === selectedStoreId;
    return (
      <button
        onClick={() => onStoreSelect(detail)}
        className="w-full flex flex-col px-3 py-2 border-b border-gray-100 transition-colors text-left hover:bg-gray-50"
        style={isSel ? { boxShadow: `inset 0 0 8px ${SHADOW_COLOR[sev]}`, background: SELECTED_BG[sev] } : undefined}
      >
        <div className="text-[11px] font-medium text-content truncate w-full">{detail.store_name}</div>
        <div className="flex items-center justify-between mt-0.5 w-full">
          <div className="text-[9px] text-content/50">{detail.cashier_count} cashiers</div>
          <div className="flex items-baseline gap-1 rounded px-1 py-0.5" style={chipStyle}>
            <span className="text-[8px] text-content/50">Trans</span>
            <span className="text-[9px] font-semibold text-content">{detail.transaction_count}</span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white" style={{ width: "34%", flexShrink: 0 }}>
      {/* Navy header */}
      <div className="flex-shrink-0 px-3 py-2.5" style={{ background: "#1e2a4a" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-white">Loss Prevention</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{dateLabel}</div>
          </div>
          <button
            onClick={onOpenSearch}
            className="w-7 h-7 flex items-center justify-center rounded border transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }}
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Exception type tabs — Description excluded until further notice */}
      <div className="flex flex-shrink-0 border-b border-gray-100 overflow-x-auto no-scrollbar">
        {saleTypes.filter((st) => st.sale_type !== "Description").map((st) => (
          <button
            key={st.sale_type}
            onClick={() => onSaleTypeSelect(st.sale_type)}
            className="flex-1 text-center px-2 py-2 text-[11px] whitespace-nowrap transition-colors"
            style={{
              borderBottom: selectedSaleType === st.sale_type ? "2px solid #1e2a4a" : "2px solid transparent",
              color: selectedSaleType === st.sale_type ? "#1e2a4a" : "var(--color-text-secondary)",
              fontWeight: selectedSaleType === st.sale_type ? 500 : 400,
            }}
          >
            {st.sale_type}
          </button>
        ))}
      </div>

      {/* Store tier columns — always flex-[55] so height is consistent */}
      <div className="flex-[55] min-h-0 flex flex-col">
        {loading && cashierDetails.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-content/40">Loading…</div>
        ) : cashierDetails.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-content/40">
            {selectedSaleType ? "No stores found" : "Select an exception type"}
          </div>
        ) : (
          <>
            {/* Tier header strip */}
            <div className="flex-shrink-0 grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-red-50">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#ef4444" }} />
                <span className="text-[10px] font-medium text-content/60 flex-1">Critical</span>
                <span className="text-[12px] font-semibold text-content">{criticalStores.length}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-amber-50">
                <ExclamationCircleIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                <span className="text-[10px] font-medium text-content/60 flex-1">Watch</span>
                <span className="text-[12px] font-semibold text-content">{watchStores.length}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-emerald-50">
                <CheckCircleIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10b981" }} />
                <span className="text-[10px] font-medium text-content/60 flex-1">Healthy</span>
                <span className="text-[12px] font-semibold text-content">{healthyStores.length}</span>
              </div>
            </div>

            {/* Three scrollable store columns */}
            <div className="flex-1 min-h-0 grid grid-cols-3 divide-x divide-gray-100 overflow-hidden">
              <div className="overflow-y-auto thin-scrollbar">
                {criticalStores.length === 0 ? (
                  <div className="flex items-center justify-center h-12 text-[10px] text-content/30">None</div>
                ) : (
                  criticalStores.map((d) => <StoreRow key={d.storeid} detail={d} />)
                )}
              </div>
              <div className="overflow-y-auto thin-scrollbar">
                {watchStores.length === 0 ? (
                  <div className="flex items-center justify-center h-12 text-[10px] text-content/30">None</div>
                ) : (
                  watchStores.map((d) => <StoreRow key={d.storeid} detail={d} />)
                )}
              </div>
              <div className="overflow-y-auto thin-scrollbar">
                {healthyStores.length === 0 ? (
                  <div className="flex items-center justify-center h-12 text-[10px] text-content/30">None</div>
                ) : (
                  healthyStores.map((d) => <StoreRow key={d.storeid} detail={d} />)
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cashiers section — always flex-[45], shows content only when ready */}
      <div className="flex-[45] min-h-0 flex flex-col border-t border-gray-100">
        {selectedStoreId > 0 && cashiers.length > 0 ? (
          <>
            <div className="px-3 py-1.5 flex-shrink-0 border-b border-gray-100" style={{ background: "rgba(30,42,74,0.04)" }}>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#1e2a4a]">Cashiers</span>
            </div>
            <div className="grid flex-shrink-0 border-b border-gray-100" style={{ gridTemplateColumns: "1fr 0.55fr 0.7fr" }}>
              {["Cashier", "Trans", "Sales"].map((h) => (
                <div key={h} className="px-3 py-1 text-[8px] font-medium uppercase tracking-wide text-content/50">{h}</div>
              ))}
            </div>
            <div className="overflow-y-auto thin-scrollbar flex-1 min-h-0">
              {cashiers.map((c) => {
                const isSel = c.cashier_number === selectedCashier.cashier_number && c.store_number === selectedCashier.store_number;
                return (
                  <button
                    key={c.cashier_number}
                    onClick={() => handleCashierClick(c.cashier_number, c.store_number)}
                    className="w-full grid border-b border-gray-100 transition-colors hover:bg-gray-50 text-left"
                    style={{
                      gridTemplateColumns: "1fr 0.55fr 0.7fr",
                      ...(isSel ? { boxShadow: "inset 0 0 6px rgba(30,42,74,0.14)", background: "rgba(30,42,74,0.04)" } : {}),
                    }}
                  >
                    <div className="px-3 py-2 text-[10px] font-medium text-content truncate">{c.cashier_name}</div>
                    <div className="px-3 py-2 text-[10px] text-content">{c.transaction_count}</div>
                    <div className="px-3 py-2 text-[10px] text-content">{formatCurrency2(c.total_sales)}</div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[10px] text-content/25">
            {selectedStoreId > 0 ? "Loading cashiers…" : "Select a store"}
          </div>
        )}
      </div>

    </div>
  );
};

export default LPStorePanel;
