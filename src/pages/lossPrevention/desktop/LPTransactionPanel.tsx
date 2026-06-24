import { useMemo, useState, useRef, useEffect } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setSaleDateFilter,
  setSalesThreshold,
  setQtyThreshold,
  setTransIdFilter,
} from "../../../features/lossPreventionSlice";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import type { TransactionListItem, TransactionOverview } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import SelectFilter from "../../../components/filters/SelectFilter";
import Transaction from "../Transaction";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import type { ThresholdValue } from "../../../components/filters/ThresholdFilter";

const fmtDate = (iso: string) => {
  const d = iso.split("T")[0].split("-");
  return `${d[1]}/${d[2]}/${d[0]}`;
};

const fmtThreshold = (t: ThresholdValue | null, prefix = ""): string => {
  if (!t) return "";
  const sym = t.op === "gt" ? ">" : t.op === "lt" ? "<" : "=";
  return `${sym} ${prefix}${t.amount}`;
};

/* ─── Column filter popover ─── */
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
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleApply = () => {
    onApply();
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleApply();
  };

  const labelColor = open || active ? "#1e2a4a" : hovered ? "rgba(30,42,74,0.65)" : "rgba(30,42,74,0.4)";

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
            >
              ✕
            </button>
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
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded py-1 text-[10px] font-medium transition-colors"
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

/* ─── Main component ─── */
interface Props {
  onTransactionClick: (overview: TransactionOverview) => void;
  onShowAll: (filtered: TransactionListItem[]) => void;
}

const LPTransactionPanel = ({ onTransactionClick, onShowAll }: Props) => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((s) => s.lossPrevention);
  const [selectedOverview, setSelectedOverview] = useState<TransactionOverview | null>(null);

  // Draft states (what user is typing)
  const [draftTransId,      setDraftTransId]      = useState("");
  const [draftCashierName,  setDraftCashierName]   = useState("");
  const [draftCashierNum,   setDraftCashierNum]    = useState("");
  const [draftQty,          setDraftQty]           = useState<ThresholdValue | null>(null);
  const [draftSales,        setDraftSales]         = useState<ThresholdValue | null>(null);

  // Applied states (what the grid actually filters by)
  const [appliedTransId,     setAppliedTransId]     = useState("");
  const [appliedCashierName, setAppliedCashierName] = useState("");
  const [appliedCashierNum,  setAppliedCashierNum]  = useState("");
  const [appliedQty,         setAppliedQty]         = useState<ThresholdValue | null>(null);
  const [appliedSales,       setAppliedSales]       = useState<ThresholdValue | null>(null);

  const {
    selectedStoreId, cashierDetails, cashierTrends, selectedSaleType,
    transOverviews, transList, selectedCashier,
    fetchingCashierTransactions, transactionLoadingMessage,
    saleDateFilter, transactionDrillDown,
  } = cashier;

  const detail = cashierDetails.find((d) => d.storeid === selectedStoreId) ?? null;
  const trend  = cashierTrends.find((t) => t.storeid === selectedStoreId) ?? null;

  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(transOverviews.map((o) => o.sale_date.split("T")[0]))).sort().reverse();
    return dates.map((d) => ({ label: fmtDate(d), value: d }));
  }, [transOverviews]);

  const filteredOverviews = useMemo(() => {
    const selCashier = selectedCashier.cashier_number;
    const transId    = appliedTransId.toLowerCase();
    const cashName   = appliedCashierName.toLowerCase();
    const cashNum    = appliedCashierNum.trim();

    return transOverviews.filter((item) => {
      if (selCashier && item.cashier_number !== selCashier) return false;
      if (saleDateFilter && item.sale_date.split("T")[0] !== saleDateFilter) return false;
      if (transId && !item.transaction_id.toLowerCase().includes(transId)) return false;
      if (cashName && !item.cashier_name.toLowerCase().includes(cashName)) return false;
      if (cashNum && String(item.cashier_number) !== cashNum) return false;
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
  }, [transOverviews, selectedCashier, saleDateFilter, appliedTransId, appliedCashierName, appliedCashierNum, appliedSales, appliedQty]);

  const filteredItems = useMemo(() => {
    const ids = new Set(filteredOverviews.map((o) => o.transaction_id));
    return transList.filter((item) => ids.has(item.transaction_id));
  }, [filteredOverviews, transList]);

  const stampMap = useMemo(() => {
    const map = new Map<string, string[]>();
    filteredItems.forEach((item) => {
      const stamps: string[] = [];
      if ((item.fs ?? 0) > 0)  stamps.push("FS");
      if ((item.fsa ?? 0) > 0) stamps.push("FSA");
      if ((item.wic ?? 0) > 0) stamps.push("WIC");
      if (stamps.length > 0) {
        const existing = map.get(item.transaction_id) ?? [];
        stamps.forEach((s) => { if (!existing.includes(s)) existing.push(s); });
        map.set(item.transaction_id, existing);
      }
    });
    return map;
  }, [filteredItems]);

  const isNoDollar = selectedSaleType.toLowerCase().replace(/[^a-z]/g, "") === "nosale";

  const overallSeverity = useMemo(() => {
    if (!detail || !trend) return null;
    if (isNoDollar) {
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
  }, [detail, trend, isNoDollar]);

  const metrics = detail && trend ? [
    { label: "Trans",    current: detail.transaction_count, trendVal: trend.transaction_count, fmt: (v: number) => String(v),  gradable: true,        isGood: detail.transaction_count < trend.transaction_count },
    { label: "Items",    current: detail.total_items,       trendVal: trend.total_items,       fmt: (v: number) => String(v),  gradable: true,        isGood: detail.total_items < trend.total_items },
    { label: "Total",    current: detail.amount,            trendVal: trend.amount,            fmt: formatCurrency2,            gradable: !isNoDollar, isGood: isNoDollar ? null : Math.abs(detail.amount) < Math.abs(trend.amount) },
    { label: "Avg $",    current: detail.average_dollars,   trendVal: trend.average_dollars,   fmt: formatCurrency2,            gradable: !isNoDollar, isGood: isNoDollar ? null : Math.abs(detail.average_dollars) < Math.abs(trend.average_dollars) },
    { label: "Cashiers", current: detail.cashier_count,     trendVal: trend.cashier_count,     fmt: (v: number) => String(v),  gradable: false,       isGood: null as boolean | null },
  ] : null;

  const renderMetricDelta = (current: number, trendVal: number, gradable: boolean, isGood: boolean | null) => {
    if (!gradable || isGood === null) return null;
    const absCurrent = Math.abs(current);
    const absTrend   = Math.abs(trendVal);
    if (absTrend === 0) return null;
    const pct = ((absCurrent - absTrend) / absTrend) * 100;
    const color = isGood ? "#10b981" : "#ef4444";
    return (
      <span style={{ color }} className="text-[9px] font-medium">
        {pct > 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
      </span>
    );
  };

  const handleRowClick = (overview: TransactionOverview) => {
    setSelectedOverview(overview);
    onTransactionClick(overview);
  };

  const isReceiptMode    = selectedOverview !== null;
  const receiptData      = transactionDrillDown[0] ?? null;
  const isReceiptLoading = isReceiptMode && receiptData === null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    fontSize: 11,
    border: "1px solid rgba(30,42,74,0.15)",
    borderRadius: 4,
    padding: "4px 7px",
    outline: "none",
    color: "var(--color-text-primary)",
    background: "rgba(30,42,74,0.03)",
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white">
      {!selectedStoreId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-[13px] font-medium text-content/30">
            {cashierDetails.length > 0
              ? "Select a store to view transactions"
              : selectedSaleType
                ? "No exceptions found"
                : "Select an exception type"}
          </div>
        </div>
      ) : (
        <>
          {/* Navy header */}
          <div className="flex-shrink-0 px-4 py-2.5" style={{ background: "#1e2a4a" }}>
            <div className="text-[13px] font-semibold text-white">
              {detail?.store_name ?? `Store ${selectedStoreId}`}
              <span className="ml-2 text-[11px] font-normal" style={{ color: "rgba(255,255,255,0.55)" }}>
                — {selectedSaleType}
              </span>
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              {detail?.cashier_count} cashiers · {detail?.transaction_count} transactions
            </div>
          </div>

          {/* KPI trend strip */}
          {metrics && (
            <div className="flex-shrink-0 grid gap-2 px-4 py-3 border-b border-gray-100 bg-custom-white" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-md overflow-hidden flex flex-col"
                  style={{ background: m.isGood !== null ? (m.isGood ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)") : "rgba(30,42,74,0.04)" }}
                >
                  <div className="px-2.5 pt-2 pb-1.5 flex-1">
                    <div className="text-[9px] uppercase tracking-[0.04em] font-medium text-content/50 mb-1">{m.label}</div>
                    <div className="text-[18px] font-medium text-content leading-none">{m.fmt(m.current)}</div>
                  </div>
                  <div className="px-2.5 pb-2 flex items-center justify-between gap-1">
                    <span className="text-[9px] text-content/40">trend {m.fmt(m.trendVal)}</span>
                    {renderMetricDelta(m.current, m.trendVal, m.gradable, m.isGood)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Body */}
          {isReceiptMode ? (
            <div className="flex flex-1 min-h-0">
              <div className="flex flex-col border-r border-gray-100" style={{ width: 130, flexShrink: 0 }}>
                <button
                  onClick={() => setSelectedOverview(null)}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-2 text-[10px] font-medium text-[#1e2a4a] hover:bg-gray-50 transition-colors border-b border-gray-100 sticky top-0 bg-custom-white z-10"
                >
                  <span>←</span>
                  <span>Go Back</span>
                </button>
                <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                  {filteredOverviews.map((o, i) => {
                    const isSelected = selectedOverview?.transaction_id === o.transaction_id;
                    return (
                      <button
                        key={o.transaction_id + i}
                        onClick={() => handleRowClick(o)}
                        className="w-full text-left px-2.5 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        style={{
                          borderLeft: isSelected ? "2.5px solid #1e2a4a" : "2.5px solid transparent",
                          background: isSelected ? "rgba(30,42,74,0.05)" : undefined,
                        }}
                      >
                        <div className="text-[10px] font-semibold truncate" style={{ color: isSelected ? "#1e2a4a" : "rgba(30,42,74,0.55)" }}>
                          {o.transaction_id}
                        </div>
                        <div className="text-[8.5px] text-content/55 truncate mt-0.5">{o.cashier_name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                {isReceiptLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-24 w-full"><LoadingIndicator message="Fetching transaction…" /></div>
                  </div>
                ) : receiptData ? (
                  <Transaction trans={receiptData} />
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
              {filteredOverviews.length === 0 && !fetchingCashierTransactions ? (
                <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
                  {transactionLoadingMessage || "No transactions found"}
                </div>
              ) : (
                <>
                  {/* Column headers with filter popovers */}
                  <div
                    className="grid sticky top-0 z-10 bg-custom-white border-b border-gray-100"
                    style={{ gridTemplateColumns: "0.9fr 0.7fr 1.1fr 0.6fr 0.5fr 0.65fr" }}
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
                    <div className="px-3 py-2">
                      <ColFilter
                        label="Cashier" active={!!appliedCashierName} appliedDisplay={appliedCashierName}
                        onApply={() => setAppliedCashierName(draftCashierName)}
                        onClear={() => { setAppliedCashierName(""); setDraftCashierName(""); }}
                      >
                        <input autoFocus style={inputStyle} placeholder="Search name…" value={draftCashierName} onChange={(e) => setDraftCashierName(e.target.value)} />
                      </ColFilter>
                    </div>
                    <div className="px-3 py-2">
                      <ColFilter
                        label="Cashier #" active={!!appliedCashierNum} appliedDisplay={appliedCashierNum}
                        onApply={() => setAppliedCashierNum(draftCashierNum)}
                        onClear={() => { setAppliedCashierNum(""); setDraftCashierNum(""); }}
                      >
                        <input autoFocus style={inputStyle} placeholder="Cashier #…" value={draftCashierNum} onChange={(e) => setDraftCashierNum(e.target.value)} />
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

                  {/* Rows */}
                  {filteredOverviews.map((o, i) => (
                    <div
                      key={o.transaction_id + i}
                      className="grid border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      style={{ gridTemplateColumns: "0.9fr 0.7fr 1.1fr 0.6fr 0.5fr 0.65fr", background: i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined }}
                    >
                      <button
                        onClick={() => handleRowClick(o)}
                        className="px-3 py-2 text-[11px] font-semibold text-[#1e2a4a] underline underline-offset-2 text-left truncate"
                      >
                        {o.transaction_id}
                      </button>
                      <div className="px-3 py-2 text-[11px] text-content">{fmtDate(o.sale_date)}</div>
                      <div className="px-3 py-2 text-[11px] text-content truncate">{o.cashier_name}</div>
                      <div className="px-3 py-2 text-[11px] text-content">{o.cashier_number}</div>
                      <div className="px-3 py-2 text-[11px] text-content text-right">{o.qty}</div>
                      <div className="px-3 py-2 text-[11px] text-content text-right">{formatCurrency2(o.total_sales)}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LPTransactionPanel;
