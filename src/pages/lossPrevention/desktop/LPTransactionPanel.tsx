import { useMemo, useState, useRef, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch, useStoreName } from "../../../hooks";
import {
  setSaleDateFilter,
  setSelectedCashier,
  setCashierSaleIds,
} from "../../../features/lossPreventionSlice";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import type { TransactionListItem, TransactionOverview } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import SelectFilter from "../../../components/filters/SelectFilter";
import Transaction, { type TransactionHandle } from "../Transaction";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../../components/EmptyPrompt";
import type { ThresholdValue } from "../../../components/filters/ThresholdFilter";
import { gradeAllCashiers, type CashierSeverity } from "../gradingUtils";

const fmtDate = (iso: string) => {
  const d = iso.split("T")[0].split("-");
  return `${d[1]}/${d[2]}/${d[0]}`;
};

const fmtThreshold = (t: ThresholdValue | null, prefix = ""): string => {
  if (!t) return "";
  const sym = t.op === "gt" ? ">" : t.op === "lt" ? "<" : "=";
  return `${sym} ${prefix}${t.amount}`;
};

// ── Severity selection colors (mirrors LPStorePanel) ─────────────────────────

const SEV_SHADOW: Record<CashierSeverity, string> = {
  critical: "rgba(239,68,68,0.25)",
  watch:    "rgba(245,158,11,0.25)",
  ok:       "rgba(16,185,129,0.25)",
};
// ── Severity badge (matches Sales SeverityBadge) ──────────────────────────────

const SEV_BADGE_BG: Record<CashierSeverity, string> = {
  critical: "#fee2e2",
  watch:    "#fef3c7",
  ok:       "#d1fae5",
};

const SEV_ICON: Record<CashierSeverity, React.ReactNode> = {
  critical: (
    <div className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0" style={{ background: SEV_BADGE_BG.critical }}>
      <ExclamationTriangleIcon className="w-3 h-3" style={{ color: "#ef4444" }} />
    </div>
  ),
  watch: (
    <div className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0" style={{ background: SEV_BADGE_BG.watch }}>
      <ExclamationCircleIcon className="w-3 h-3" style={{ color: "#f59e0b" }} />
    </div>
  ),
  ok: (
    <div className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0" style={{ background: SEV_BADGE_BG.ok }}>
      <CheckCircleIcon className="w-3 h-3" style={{ color: "#10b981" }} />
    </div>
  ),
};

// ── Shared strip cell ─────────────────────────────────────────────────────────

const StripCell = ({ label, value, badge }: { label: string; value: string; badge: React.ReactNode }) => (
  <div className="px-3.5 py-[11px] bg-white">
    <div className="text-[8px] font-bold uppercase tracking-[.07em] text-content/40 mb-1">{label}</div>
    <div className="text-[15px] font-bold text-[#1e2a4a] leading-none">{value}</div>
    <div className="mt-1.5">{badge}</div>
  </div>
);

// ── Store KPI badge ("trend") ─────────────────────────────────────────────────

const TrendBadge = ({ current, trend, useAbs = false }: { current: number; trend: number; useAbs?: boolean }) => {
  if (trend === 0) return null;
  const c   = useAbs ? Math.abs(current) : current;
  const t   = useAbs ? Math.abs(trend)   : trend;
  const pct = ((c - t) / t) * 100;
  const isUp = pct > 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded"
      style={isUp
        ? { background: "rgba(220,38,38,0.09)", color: "#dc2626" }
        : { background: "rgba(22,163,74,0.09)",  color: "#16a34a" }}
    >
      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% trend
    </span>
  );
};

// ── Cashier breakdown badge ("avg") ──────────────────────────────────────────

const AvgBadge = ({ pct }: { pct: number }) => {
  const isUp = pct > 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded"
      style={isUp
        ? { background: "rgba(220,38,38,0.09)", color: "#dc2626" }
        : { background: "rgba(22,163,74,0.09)",  color: "#16a34a" }}
    >
      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% avg
    </span>
  );
};

// ── Column filter popover ─────────────────────────────────────────────────────

interface ColFilterProps {
  label: string;
  active: boolean;
  appliedDisplay?: string;
  align?: "left" | "right";
  onApply: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

const ColFilter = ({ label, active, appliedDisplay, align = "left", onApply, onClear, children }: ColFilterProps) => {
  const [open, setOpen]       = useState(false);
  const [hovered, setHovered] = useState(false);
  const wrapRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleApply  = () => { onApply(); setOpen(false); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleApply(); };
  const labelColor   = open || active ? "#1e2a4a" : hovered ? "rgba(30,42,74,0.65)" : "rgba(30,42,74,0.4)";

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1 min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors select-none flex-shrink-0"
        style={{ color: labelColor }}
      >
        {label}
      </button>

      {active && appliedDisplay && (
        <span className="flex items-center gap-0.5 rounded px-1 py-0.5 flex-shrink-0" style={{ background: "rgba(30,42,74,0.08)", maxWidth: 90 }}>
          <span className="text-[8px] font-medium text-[#1e2a4a] truncate">{appliedDisplay}</span>
          {onClear && (
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-[8px] text-[#1e2a4a]/50 hover:text-[#1e2a4a] leading-none flex-shrink-0 ml-0.5"
            >✕</button>
          )}
        </span>
      )}

      {open && <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />}
      {open && (
        <div
          onKeyDown={handleKeyDown}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            zIndex: 200,
            background: "white",
            border: "1px solid rgba(30,42,74,0.12)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            padding: "10px 10px 8px",
            minWidth: 176,
          }}
        >
          {children}
          <button
            onClick={handleApply}
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded py-1 text-[10px] font-medium"
            style={{ background: "#1e2a4a", color: "white" }}
          >
            <MagnifyingGlassIcon className="w-3 h-3" />
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  onTransactionClick: (overview: TransactionOverview) => void;
  onShowAll: (filtered: TransactionListItem[]) => void;
}

const LPTransactionPanel = ({ onTransactionClick, onShowAll }: Props) => {
  const dispatch = useAppDispatch();
  const cashier  = useAppSelector((s) => s.lossPrevention);

  const [selectedOverview, setSelectedOverview] = useState<TransactionOverview | null>(null);
  const transactionRef = useRef<TransactionHandle>(null);
  const [cashierSevFilter, setCashierSevFilter] = useState<CashierSeverity | "all">("all");
  const [draftTransId, setDraftTransId]         = useState("");
  const [draftQty,     setDraftQty]             = useState<ThresholdValue | null>(null);
  const [draftSales,   setDraftSales]           = useState<ThresholdValue | null>(null);
  const [appliedTransId, setAppliedTransId]     = useState("");
  const [appliedQty,     setAppliedQty]         = useState<ThresholdValue | null>(null);
  const [appliedSales,   setAppliedSales]       = useState<ThresholdValue | null>(null);

  const {
    selectedStoreId, cashierDetails, cashierTrends, selectedSaleType,
    transOverviews, transList, cashiers, selectedCashier,
    fetchingCashierTransactions, transactionLoadingMessage,
    saleDateFilter, transactionDrillDown,
  } = cashier;

  const detail = cashierDetails.find((d) => d.storeid === selectedStoreId) ?? null;
  const trend  = cashierTrends.find((t)  => t.storeid === selectedStoreId) ?? null;
  const storeName = useStoreName(selectedStoreId ?? 0, detail?.store_name);

  // ── Graded cashier list ───────────────────────────────────────────────────

  const isNoDollar = selectedSaleType.toLowerCase().replace(/[^a-z]/g, "") === "nosale";

  const cashierGrades = useMemo(
    () => gradeAllCashiers(transOverviews, cashiers, selectedSaleType),
    [transOverviews, cashiers, selectedSaleType],
  );

  const selectedGrade = cashierGrades.find(
    (g) => g.cashier_number === selectedCashier.cashier_number,
  ) ?? null;

  const peerAvgs = cashierGrades.length > 0 ? {
    trans:     cashierGrades[0].trans.avg,
    qty:       cashierGrades[0].qty.avg,
    sales:     cashierGrades[0].sales.avg,
  } : null;

  const critCount    = cashierGrades.filter((g) => g.severity === "critical").length;
  const watchCount   = cashierGrades.filter((g) => g.severity === "watch").length;
  const okCount      = cashierGrades.filter((g) => g.severity === "ok").length;
  const visibleGrades = cashierSevFilter === "all" ? cashierGrades : cashierGrades.filter((g) => g.severity === cashierSevFilter);

  const chipClass = (active: boolean, sev?: CashierSeverity) => {
    if (!active) return "bg-white border-gray-200 text-content/65 hover:border-gray-400";
    if (!sev) return "bg-[#1e2a4a] border-[#1e2a4a] text-white";
    const m: Record<CashierSeverity, string> = {
      critical: "bg-red-600 border-red-600 text-white",
      watch:    "bg-amber-500 border-amber-500 text-white",
      ok:       "bg-emerald-600 border-emerald-600 text-white",
    };
    return m[sev];
  };

  // ── Cashier click ─────────────────────────────────────────────────────────

  const handleCashierClick = (cashier_number: number, store_number: string) => {
    if (cashier_number === selectedCashier.cashier_number && store_number === selectedCashier.store_number) {
      dispatch(setCashierSaleIds([]));
      dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
      return;
    }
    dispatch(setSelectedCashier({ cashier_number, store_number }));
    setSelectedOverview(null);
  };

  // ── Filters ───────────────────────────────────────────────────────────────

  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(transOverviews.map((o) => o.sale_date.split("T")[0]))).sort().reverse();
    return dates.map((d) => ({ label: fmtDate(d), value: d }));
  }, [transOverviews]);

  const filteredOverviews = useMemo(() => {
    const selCashier = selectedCashier.cashier_number;
    const transId    = appliedTransId.toLowerCase();
    return transOverviews.filter((item) => {
      if (selCashier && item.cashier_number !== selCashier) return false;
      if (saleDateFilter && item.sale_date.split("T")[0] !== saleDateFilter) return false;
      if (transId && !item.transaction_id.toLowerCase().includes(transId)) return false;
      if (appliedSales) {
        const s = item.total_sales;
        if (appliedSales.op === "gt" && !(s > appliedSales.amount)) return false;
        if (appliedSales.op === "lt" && !(s < appliedSales.amount)) return false;
        if (appliedSales.op === "eq" && s !== appliedSales.amount)  return false;
      }
      if (appliedQty) {
        const q = item.qty ?? 0;
        if (appliedQty.op === "gt" && !(q > appliedQty.amount)) return false;
        if (appliedQty.op === "lt" && !(q < appliedQty.amount)) return false;
        if (appliedQty.op === "eq" && q !== appliedQty.amount)  return false;
      }
      return true;
    });
  }, [transOverviews, selectedCashier, saleDateFilter, appliedTransId, appliedSales, appliedQty]);

  // ── Receipt mode ──────────────────────────────────────────────────────────

  const isReceiptMode    = selectedOverview !== null;
  const receiptData      = transactionDrillDown[0] ?? null;
  const isReceiptLoading = isReceiptMode && receiptData === null;

  const handleRowClick = (overview: TransactionOverview) => {
    setSelectedOverview(overview);
    onTransactionClick(overview);
  };

  // ── Strip data ────────────────────────────────────────────────────────────

  const kpiMetrics = detail && trend ? [
    { label: "Transactions", value: String(detail.transaction_count),        current: detail.transaction_count,  trendVal: trend.transaction_count,  useAbs: false          },
    { label: "Items",        value: String(detail.total_items),              current: detail.total_items,        trendVal: trend.total_items,        useAbs: false          },
    { label: "Total",        value: formatCurrency2(detail.amount),          current: detail.amount,             trendVal: trend.amount,             useAbs: !isNoDollar    },
    { label: "Avg ticket",   value: formatCurrency2(detail.average_dollars), current: detail.average_dollars,    trendVal: trend.average_dollars,    useAbs: !isNoDollar    },
  ] : null;

  const scoreMetrics = selectedGrade ? [
    { label: "Transactions", value: String(selectedGrade.trans.value),              pct: selectedGrade.trans.pct  },
    { label: "Items",        value: String(selectedGrade.qty.value),                pct: selectedGrade.qty.pct    },
    ...(!isNoDollar ? [
      { label: "Total",      value: formatCurrency2(selectedGrade.sales.value),     pct: selectedGrade.sales.pct      },
      { label: "Avg ticket", value: formatCurrency2(selectedGrade.avgTicket.value), pct: selectedGrade.avgTicket.pct  },
    ] : []),
  ] : null;

  const inputStyle: React.CSSProperties = {
    width: "100%", fontSize: 11,
    border: "1px solid rgba(30,42,74,0.15)", borderRadius: 4,
    padding: "4px 7px", outline: "none",
    color: "var(--color-text-primary)", background: "rgba(30,42,74,0.03)",
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 min-w-0 flex flex-col shadow-lg rounded-xl">

      {!selectedStoreId ? (
        <EmptyPrompt
          title="No store selected"
          description={cashierDetails.length > 0
            ? "Select a store from the list to view its cashiers"
            : selectedSaleType ? "No exceptions found" : "Select an exception type"}
        />
      ) : (
        <div className="flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden bg-custom-white">
          {/* Navy header */}
          <div className="flex-shrink-0 px-4 py-[11px]" style={{ background: "#1e2a4a" }}>
            <div className="text-[13px] font-semibold text-white">
              {storeName}
              <span className="ml-2 text-[11px] font-normal" style={{ color: "rgba(255,255,255,0.55)" }}>
                — {selectedSaleType}
              </span>
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              {detail?.cashier_count} cashiers · {detail?.transaction_count} transactions
            </div>
          </div>

          {/* Store KPI strip — always visible */}
          {kpiMetrics && (
            <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
              {kpiMetrics.map((m) => (
                <StripCell
                  key={m.label}
                  label={m.label}
                  value={m.value}
                  badge={<TrendBadge current={m.current} trend={m.trendVal} useAbs={m.useAbs} />}
                />
              ))}
            </div>
          )}

          {/* Split body */}
          <div className="flex flex-1 min-h-0">

            {/* Left: cashier list */}
            <div className="flex flex-col border-r border-gray-100" style={{ width: 286, flexShrink: 0 }}>
              {fetchingCashierTransactions && cashierGrades.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[10px] text-content/30">
                  Loading cashiers…
                </div>
              ) : cashierGrades.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[10px] text-content/30">
                  No cashier data
                </div>
              ) : (
                <>
                  {/* Severity filter chips */}
                  <div className="flex-shrink-0 flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-100">
                    <button onClick={() => setCashierSevFilter("all")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(cashierSevFilter === "all")}`}>All ({cashierGrades.length})</button>
                    <button onClick={() => setCashierSevFilter("critical")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(cashierSevFilter === "critical", "critical")}`}><ExclamationTriangleIcon className="w-2.5 h-2.5" />Crit ({critCount})</button>
                    <button onClick={() => setCashierSevFilter("watch")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(cashierSevFilter === "watch", "watch")}`}><ExclamationCircleIcon className="w-2.5 h-2.5" />Watch ({watchCount})</button>
                    <button onClick={() => setCashierSevFilter("ok")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(cashierSevFilter === "ok", "ok")}`}><CheckCircleIcon className="w-2.5 h-2.5" />OK ({okCount})</button>
                  </div>

                  {/* Column header + scrollable cashier rows + sticky avg footer */}
                  <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                    <div
                      className="sticky top-0 z-10 grid border-b border-gray-100 bg-gray-100"
                      style={{ gridTemplateColumns: "1fr 0.42fr 0.42fr 0.58fr" }}
                    >
                      {(["Cashier", "Trans", "Qty", "Sales"] as const).map((h, i) => (
                        <div
                          key={h}
                          className={`px-2 py-1.5 text-[8px] font-bold uppercase tracking-wide text-content/35 ${i > 0 ? "text-right" : ""}`}
                        >
                          {h}
                        </div>
                      ))}
                    </div>
                    {visibleGrades.map((g) => {
                      const isSel = g.cashier_number === selectedCashier.cashier_number;
                      return (
                        <button
                          key={g.cashier_number}
                          onClick={() => handleCashierClick(g.cashier_number, g.store_number)}
                          className={`w-full grid border-b border-gray-50 transition-colors text-left ${isSel ? "bg-white" : "hover:bg-gray-50"}`}
                          style={{
                            gridTemplateColumns: "1fr 0.42fr 0.42fr 0.58fr",
                            ...(isSel ? { boxShadow: `inset 0 0 8px ${SEV_SHADOW[g.severity]}` } : {}),
                          }}
                        >
                          <div className="px-2 py-[11px] flex items-center gap-1.5 min-w-0">
                            {SEV_ICON[g.severity]}
                            <span className="text-[10px] font-medium truncate text-[#1e2a4a]">
                              {g.cashier_name}
                            </span>
                          </div>
                          <div className="px-2 py-[11px] text-[10px] text-right tabular-nums font-semibold text-[#1e2a4a]">
                            {g.trans.value}
                          </div>
                          <div className="px-2 py-[11px] text-[10px] text-right tabular-nums font-semibold text-[#1e2a4a]">
                            {g.qty.value}
                          </div>
                          <div className="px-2 py-[11px] text-[10px] text-right tabular-nums font-semibold text-[#1e2a4a]">
                            {formatCurrency2(g.sales.value)}
                          </div>
                        </button>
                      );
                    })}

                    {/* Avg footer — sticky at bottom of scroll container */}
                    {peerAvgs && (
                      <div
                        className="grid border-t border-gray-100 bg-gray-100 sticky bottom-0"
                        style={{ gridTemplateColumns: "1fr 0.42fr 0.42fr 0.58fr" }}
                      >
                        <div className="px-2 py-2 text-[8px] font-bold uppercase tracking-wide text-content/70">Avg</div>
                        <div className="px-2 py-2 text-[10px] text-right tabular-nums text-content/70">{Math.round(peerAvgs.trans)}</div>
                        <div className="px-2 py-2 text-[10px] text-right tabular-nums text-content/70">{Math.round(peerAvgs.qty)}</div>
                        <div className="px-2 py-2 text-[10px] text-right tabular-nums text-content/70">{formatCurrency2(peerAvgs.sales)}</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right: score strip + transaction list / receipt */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">

              {/* Cashier score strip — always visible when a cashier is selected */}
              {scoreMetrics && selectedGrade && (
                <>
                  <div className="flex-shrink-0 px-3.5 py-1.5 border-b border-gray-100 bg-gray-100">
                    <div className="text-[11px] font-bold text-[#1e2a4a]">{selectedGrade.cashier_name}</div>
                    <div className="text-[8px] font-bold uppercase tracking-[.07em] text-content/35">Cashier breakdown</div>
                  </div>
                  <div className={`flex-shrink-0 grid divide-x divide-gray-100 border-b border-gray-100 ${isNoDollar ? "grid-cols-2" : "grid-cols-4"}`}>
                    {scoreMetrics.map((m) => (
                      <StripCell key={m.label} label={m.label} value={m.value} badge={<AvgBadge pct={m.pct} />} />
                    ))}
                  </div>
                </>
              )}

              {isReceiptMode ? (
                <>
                  {/* Back bar — same height slot as the filter header so layout doesn't shift */}
                  <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-100">
                    <button
                      onClick={() => setSelectedOverview(null)}
                      className="text-[9px] font-semibold uppercase tracking-wide text-[#1e2a4a] hover:text-[#1e2a4a]/70 transition-colors"
                    >
                      ← Back
                    </button>
                    <span className="text-[9px] text-content/40">
                      #{selectedOverview?.transaction_id}
                    </span>
                    <div className="ml-auto flex gap-1.5">
                      <button
                        onClick={() => transactionRef.current?.email()}
                        className="flex items-center gap-1 text-[10px] font-medium bg-[#1e2a4a] text-white rounded px-2 py-1"
                      >
                        Email
                      </button>
                      <button
                        onClick={() => transactionRef.current?.export()}
                        className="flex items-center gap-1 text-[10px] font-medium bg-[#1e2a4a] text-white rounded px-2 py-1"
                      >
                        CSV
                      </button>
                    </div>
                  </div>
                  {/* Transaction component fills remaining space */}
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {isReceiptLoading ? (
                      <div className="flex-1 relative">
                        <LoadingIndicator message="Fetching transaction…" />
                      </div>
                    ) : receiptData ? (
                      <Transaction ref={transactionRef} trans={receiptData} />
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  {/* Transaction list */}
                  <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                    {filteredOverviews.length === 0 && !fetchingCashierTransactions ? (
                      <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
                        {transactionLoadingMessage || "No transactions found"}
                      </div>
                    ) : (
                      <>
                        {/* Column filter headers */}
                        <div
                          className="grid sticky top-0 z-10 bg-gray-100 border-b border-gray-100"
                          style={{ gridTemplateColumns: "1fr 0.7fr 0.45fr 0.6fr" }}
                        >
                          <div className="px-3 py-2">
                            <ColFilter
                              label="Trans ID" active={!!appliedTransId} appliedDisplay={appliedTransId}
                              onApply={() => setAppliedTransId(draftTransId)}
                              onClear={() => { setAppliedTransId(""); setDraftTransId(""); }}
                            >
                              <input autoFocus style={inputStyle} placeholder="Search ID…" value={draftTransId} onChange={(e) => setDraftTransId(e.target.value)} />
                            </ColFilter>
                          </div>
                          <div className="px-3 py-2">
                            <ColFilter
                              label="Date" active={!!saleDateFilter} appliedDisplay={saleDateFilter ? fmtDate(saleDateFilter) : undefined}
                              onApply={() => {}}
                              onClear={() => dispatch(setSaleDateFilter(""))}
                            >
                              <SelectFilter options={uniqueDates} value={saleDateFilter} onChange={(v) => dispatch(setSaleDateFilter(v))} placeholder="All dates" className="w-full" />
                            </ColFilter>
                          </div>
                          <div className="px-3 py-2 flex justify-end">
                            <ColFilter
                              label="Qty" active={!!appliedQty} appliedDisplay={fmtThreshold(appliedQty)} align="right"
                              onApply={() => setAppliedQty(draftQty)}
                              onClear={() => { setAppliedQty(null); setDraftQty(null); }}
                            >
                              <ThresholdFilter value={draftQty} onChange={setDraftQty} placeholder="Qty" showOp showClear stretch className="w-full" />
                            </ColFilter>
                          </div>
                          <div className="px-3 py-2 flex justify-end">
                            <ColFilter
                              label="Sales" active={!!appliedSales} appliedDisplay={fmtThreshold(appliedSales, "$")} align="right"
                              onApply={() => setAppliedSales(draftSales)}
                              onClear={() => { setAppliedSales(null); setDraftSales(null); }}
                            >
                              <ThresholdFilter value={draftSales} onChange={setDraftSales} prefix="$" placeholder="Sales" showOp showClear stretch className="w-full" />
                            </ColFilter>
                          </div>
                        </div>

                        {fetchingCashierTransactions ? (
                          <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
                            {transactionLoadingMessage || "Loading…"}
                          </div>
                        ) : (
                          filteredOverviews.map((o, i) => (
                            <div
                              key={o.transaction_id + i}
                              className="grid border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              style={{
                                gridTemplateColumns: "1fr 0.7fr 0.45fr 0.6fr",
                                background: i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined,
                              }}
                            >
                              <button
                                onClick={() => handleRowClick(o)}
                                className="px-3 py-2 text-[11px] font-semibold text-[#1e2a4a] underline underline-offset-2 text-left truncate"
                              >
                                {o.transaction_id}
                              </button>
                              <div className="px-3 py-2 text-[11px] text-content">{fmtDate(o.sale_date)}</div>
                              <div className="px-3 py-2 text-[11px] text-content text-right tabular-nums">{o.qty}</div>
                              <div className="px-3 py-2 text-[11px] text-content text-right tabular-nums">{formatCurrency2(o.total_sales)}</div>
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LPTransactionPanel;
