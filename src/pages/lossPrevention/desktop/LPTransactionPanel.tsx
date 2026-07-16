import { useMemo, useState, useRef, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/20/solid";
import LPExportModal from "./LPExportModal";
import { useAppSelector, useAppDispatch, useStoreName } from "../../../hooks";
import {
  setSaleDateFilter,
  setSelectedCashier,
  setCashierSaleIds,
} from "../../../features/lossPreventionSlice";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import type {
  TransactionListItem,
  TransactionOverview,
} from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import SelectFilter from "../../../components/filters/SelectFilter";
import Transaction from "../Transaction";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../../components/EmptyPrompt";
import type { ThresholdValue } from "../../../components/filters/ThresholdFilter";
import {
  gradeAllCashiers,
  isNoDollarType,
  storeSeverity,
  weekRangeLabel,
  weekRangeFilename,
  type CashierSeverity,
} from "../gradingUtils";
import { severityHeaderBgClass } from "../../../utils/severity";

// Cashier list uses a plain dot (list-level), matching Sales' store/sub-dept
// rows — the icon+badge treatment is reserved for item-level drill-down.
const CASHIER_DOT_CLASS: Record<CashierSeverity, string> = {
  critical: "bg-red-500",
  watch: "bg-amber-400",
  ok: "bg-emerald-500",
  ungraded: "bg-gray-300",
};

const fmtDate = (iso: string) => {
  const d = iso.split("T")[0].split("-");
  return `${d[1]}/${d[2]}/${d[0]}`;
};

const fmtThreshold = (t: ThresholdValue | null, prefix = ""): string => {
  if (!t) return "";
  const sym = t.op === "gt" ? ">" : t.op === "lt" ? "<" : "=";
  return `${sym} ${prefix}${t.amount}`;
};

// ── Shared strip cell ─────────────────────────────────────────────────────────

const StripCell = ({
  label,
  value,
  baselineValue,
  badge,
  className = "px-4 pt-2.5 text-center",
  valueClassName = "text-[14px] font-bold text-content",
}: {
  label: string;
  value: string;
  baselineValue?: string;
  badge: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) => (
  <div className={className}>
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    {baselineValue !== undefined && (
      <div
        className="text-[10px] font-bold text-content mb-0.5"
        title="Avg per week over the prior 2 weeks"
      >
        Baseline {baselineValue}
      </div>
    )}
    <div className="flex items-baseline justify-center gap-2">
      <span className={valueClassName}>{value}</span>
      {badge}
    </div>
  </div>
);

// ── Store KPI badge ("trend") ─────────────────────────────────────────────────

const TrendBadge = ({
  current,
  trend,
  useAbs = false,
}: {
  current: number;
  trend: number;
  useAbs?: boolean;
}) => {
  if (trend === 0) return null;
  const c = useAbs ? Math.abs(current) : current;
  const t = useAbs ? Math.abs(trend) : trend;
  const pct = ((c - t) / t) * 100;
  const isUp = pct > 0;
  return (
    <span
      className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
        isUp
          ? "bg-severity_critical_bg text-severity_critical_text"
          : "bg-severity_healthy_bg text-severity_healthy_text"
      }`}
    >
      {pct !== 0 && (isUp ? "▲" : "▼")} {Math.abs(pct).toFixed(2)}%
    </span>
  );
};

// ── Cashier breakdown badge ("avg") ──────────────────────────────────────────

const AvgBadge = ({
  pct,
  avg,
  textSize = "text-[11px]",
}: {
  pct: number;
  avg: number;
  textSize?: string;
}) => {
  if (avg === 0) return null;
  const isUp = pct > 0;
  return (
    <span
      className={`${textSize} font-bold px-1.5 py-0.5 rounded ${
        isUp
          ? "bg-severity_critical_bg text-severity_critical_text"
          : "bg-severity_healthy_bg text-severity_healthy_text"
      }`}
    >
      {pct !== 0 && (isUp ? "▲" : "▼")} {Math.abs(pct).toFixed(2)}%
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

const ColFilter = ({
  label,
  active,
  appliedDisplay,
  align = "left",
  onApply,
  onClear,
  children,
}: ColFilterProps) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
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
  const labelColor =
    open || active
      ? "#1e2a4a"
      : hovered
        ? "rgba(30,42,74,0.65)"
        : "rgba(30,42,74,0.4)";

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
        <span
          className="flex items-center gap-0.5 rounded px-1 py-0.5 flex-shrink-0"
          style={{ background: "rgba(30,42,74,0.08)", maxWidth: 90 }}
        >
          <span className="text-[8px] font-medium text-[#1e2a4a] truncate">
            {appliedDisplay}
          </span>
          {onClear && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-[8px] text-[#1e2a4a]/50 hover:text-[#1e2a4a] leading-none flex-shrink-0 ml-0.5"
            >
              ✕
            </button>
          )}
        </span>
      )}

      {open && (
        <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />
      )}
      {open && (
        <div
          onKeyDown={handleKeyDown}
          className="bg-custom-white"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            zIndex: 200,
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
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded py-1 text-[10px] font-medium text-custom-white"
            style={{ background: "#1e2a4a" }}
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

const LPTransactionPanel = ({ onTransactionClick }: Props) => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((s) => s.lossPrevention);
  const search = useAppSelector((s) => s.search);

  const [selectedOverview, setSelectedOverview] =
    useState<TransactionOverview | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [cashierSevFilter, setCashierSevFilter] = useState<CashierSeverity | "all">("all");
  const [draftTransId, setDraftTransId] = useState("");
  const [draftQty, setDraftQty] = useState<ThresholdValue | null>(null);
  const [draftSales, setDraftSales] = useState<ThresholdValue | null>(null);
  const [appliedTransId, setAppliedTransId] = useState("");
  const [appliedQty, setAppliedQty] = useState<ThresholdValue | null>(null);
  const [appliedSales, setAppliedSales] = useState<ThresholdValue | null>(null);

  const {
    selectedStoreId,
    cashierDetails,
    selectedSaleType,
    transOverviews,
    cashiers,
    selectedCashier,
    fetchingCashierTransactions,
    transactionLoadingMessage,
    saleDateFilter,
    transactionDrillDown,
  } = cashier;

  const detail =
    cashierDetails.find((d) => d.storeid === selectedStoreId) ?? null;
  const baselineDetail =
    cashier.baselineDetails.find((b) => b.storeid === selectedStoreId) ?? null;
  const storeName = useStoreName(selectedStoreId ?? 0, detail?.store_name);
  const tier = detail
    ? storeSeverity(detail, cashier.baselineDetails, selectedSaleType)
    : "healthy";

  const dateLabel = weekRangeLabel(search.singleDate);

  // ── Graded cashier list ───────────────────────────────────────────────────

  const isNoDollar = isNoDollarType(selectedSaleType);

  const cashierGrades = useMemo(
    () =>
      gradeAllCashiers(
        transOverviews,
        cashier.baselineOverviews,
        cashiers,
        selectedSaleType,
      ),
    [transOverviews, cashier.baselineOverviews, cashiers, selectedSaleType],
  );

  const selectedGrade =
    cashierGrades.find(
      (g) => g.cashier_number === selectedCashier.cashier_number,
    ) ?? null;

  const critCount = cashierGrades.filter((g) => g.severity === "critical").length;
  const watchCount = cashierGrades.filter((g) => g.severity === "watch").length;
  const okCount = cashierGrades.filter((g) => g.severity === "ok").length;
  const visibleGrades =
    cashierSevFilter === "all"
      ? cashierGrades
      : cashierGrades.filter((g) => g.severity === cashierSevFilter);

  // ── Cashier click ─────────────────────────────────────────────────────────

  const handleCashierClick = (cashier_number: number, store_number: string) => {
    if (
      cashier_number === selectedCashier.cashier_number &&
      store_number === selectedCashier.store_number
    ) {
      dispatch(setCashierSaleIds([]));
      dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
      return;
    }
    dispatch(setSelectedCashier({ cashier_number, store_number }));
    setSelectedOverview(null);
  };

  // ── Filters ───────────────────────────────────────────────────────────────

  const uniqueDates = useMemo(() => {
    const dates = Array.from(
      new Set(transOverviews.map((o) => o.sale_date.split("T")[0])),
    )
      .sort()
      .reverse();
    return dates.map((d) => ({ label: fmtDate(d), value: d }));
  }, [transOverviews]);

  const filteredOverviews = useMemo(() => {
    const selCashier = selectedCashier.cashier_number;
    const transId = appliedTransId.toLowerCase();
    return transOverviews.filter((item) => {
      if (selCashier && item.cashier_number !== selCashier) return false;
      if (saleDateFilter && item.sale_date.split("T")[0] !== saleDateFilter)
        return false;
      if (transId && !item.transaction_id.toLowerCase().includes(transId))
        return false;
      if (appliedSales) {
        const s = item.total_sales;
        if (appliedSales.op === "gt" && !(s > appliedSales.amount))
          return false;
        if (appliedSales.op === "lt" && !(s < appliedSales.amount))
          return false;
        if (appliedSales.op === "eq" && s !== appliedSales.amount) return false;
      }
      if (appliedQty) {
        const q = item.qty ?? 0;
        if (appliedQty.op === "gt" && !(q > appliedQty.amount)) return false;
        if (appliedQty.op === "lt" && !(q < appliedQty.amount)) return false;
        if (appliedQty.op === "eq" && q !== appliedQty.amount) return false;
      }
      return true;
    });
  }, [
    transOverviews,
    selectedCashier,
    saleDateFilter,
    appliedTransId,
    appliedSales,
    appliedQty,
  ]);

  // ── Receipt mode ──────────────────────────────────────────────────────────

  const isReceiptMode = selectedOverview !== null;
  const receiptData = transactionDrillDown[0] ?? null;
  const isReceiptLoading = isReceiptMode && receiptData === null;

  const handleRowClick = (overview: TransactionOverview) => {
    setSelectedOverview(overview);
    onTransactionClick(overview);
  };

  // ── Strip data ────────────────────────────────────────────────────────────

  const bTrans = baselineDetail ? baselineDetail.transaction_count / 2 : null;
  const bItems = baselineDetail ? baselineDetail.total_items / 2 : null;
  const bAmount = baselineDetail ? baselineDetail.amount / 2 : null;
  const bAvg = baselineDetail ? baselineDetail.average_dollars : null;

  const kpiMetrics = detail
    ? [
        {
          label: "Transactions",
          value: String(detail.transaction_count),
          baselineStr: bTrans !== null ? String(Math.round(bTrans)) : undefined,
          current: detail.transaction_count,
          trendVal: bTrans ?? 0,
          useAbs: false,
        },
        {
          label: "Qty",
          value: String(detail.total_items),
          baselineStr: bItems !== null ? String(Math.round(bItems)) : undefined,
          current: detail.total_items,
          trendVal: bItems ?? 0,
          useAbs: false,
        },
        {
          label: "Total",
          value: formatCurrency2(detail.amount),
          baselineStr: bAmount !== null ? formatCurrency2(bAmount) : undefined,
          current: detail.amount,
          trendVal: bAmount ?? 0,
          useAbs: !isNoDollar,
        },
        {
          label: "Avg ticket",
          value: formatCurrency2(detail.average_dollars),
          baselineStr: bAvg !== null ? formatCurrency2(bAvg) : undefined,
          current: detail.average_dollars,
          trendVal: bAvg ?? 0,
          useAbs: !isNoDollar,
        },
      ]
    : null;

  const scoreMetrics = selectedGrade
    ? [
        {
          label: "Transactions",
          value: String(selectedGrade.trans.value),
          baselineStr:
            selectedGrade.trans.avg > 0
              ? String(Math.round(selectedGrade.trans.avg))
              : undefined,
          pct: selectedGrade.trans.pct,
          avg: selectedGrade.trans.avg,
        },
        {
          label: "Qty",
          value: String(selectedGrade.qty.value),
          baselineStr:
            selectedGrade.qty.avg > 0
              ? String(Math.round(selectedGrade.qty.avg))
              : undefined,
          pct: selectedGrade.qty.pct,
          avg: selectedGrade.qty.avg,
        },
        ...(!isNoDollar
          ? [
              {
                label: "Total",
                value: formatCurrency2(selectedGrade.sales.value),
                baselineStr:
                  selectedGrade.sales.avg !== 0
                    ? formatCurrency2(selectedGrade.sales.avg)
                    : undefined,
                pct: selectedGrade.sales.pct,
                avg: selectedGrade.sales.avg,
              },
              {
                label: "Avg ticket",
                value: formatCurrency2(selectedGrade.avgTicket.value),
                baselineStr:
                  selectedGrade.avgTicket.avg !== 0
                    ? formatCurrency2(selectedGrade.avgTicket.avg)
                    : undefined,
                pct: selectedGrade.avgTicket.pct,
                avg: selectedGrade.avgTicket.avg,
              },
            ]
          : []),
      ]
    : null;

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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 min-w-0 flex flex-col shadow-lg rounded-xl">
      {!selectedStoreId ? (
        <EmptyPrompt
          title="No store selected"
          description={
            cashierDetails.length > 0
              ? "Select a store from the list to view its cashiers"
              : selectedSaleType
                ? "No exceptions found"
                : "Select an exception type"
          }
        />
      ) : (
        <div className="flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden bg-custom-white">
          {/* Title bar — tinted to the selected store's severity */}
          <div className={`relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${severityHeaderBgClass[tier]}`}>
            <p className="text-custom-white text-[13px] font-bold leading-tight justify-self-start">
              {storeName}
              <span className="ml-2 text-[11px] font-normal text-custom-white/70">
                — {selectedSaleType}
              </span>
            </p>
            <span className="text-custom-white text-[13px] font-bold justify-self-center">
              Weekly LP Report · {dateLabel}
            </span>
            <div className="flex items-center gap-2 justify-self-end">
              {transOverviews.length > 0 && !fetchingCashierTransactions && (
                <button
                  onClick={() => setExportOpen(true)}
                  title="Export CSV"
                  className="text-custom-white transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {exportOpen && (
            <LPExportModal
              onClose={() => setExportOpen(false)}
              storeName={storeName}
              saleType={selectedSaleType}
              dateRange={weekRangeFilename(search.singleDate)}
              transactions={filteredOverviews}
              cashierGrades={cashierGrades}
            />
          )}

          {/* Store KPI strip — always visible */}
          {kpiMetrics && (
            <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
              {kpiMetrics.map((m) => (
                <StripCell
                  key={m.label}
                  label={m.label}
                  value={m.value}
                  baselineValue={m.baselineStr}
                  badge={
                    <TrendBadge
                      current={m.current}
                      trend={m.trendVal}
                      useAbs={m.useAbs}
                    />
                  }
                />
              ))}
            </div>
          )}

          {/* Split body */}
          <div className="flex flex-1 min-h-0">
            {/* Left: cashier list */}
            <div
              className="flex flex-col border-r border-gray-100"
              style={{ width: 286, flexShrink: 0 }}
            >
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
                  <div className="flex-shrink-0 flex items-center gap-1.5 p-2 border-b border-gray-100 bg-gray-100">
                    <button
                      onClick={() => setCashierSevFilter((f) => (f === "critical" ? "all" : "critical"))}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
                        cashierSevFilter === "critical" ? "ring-2 ring-severity_critical_text/40 shadow-sm" : ""
                      }`}
                    >
                      Crit ({critCount})
                    </button>
                    <button
                      onClick={() => setCashierSevFilter((f) => (f === "watch" ? "all" : "watch"))}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
                        cashierSevFilter === "watch" ? "ring-2 ring-severity_watch_text/40 shadow-sm" : ""
                      }`}
                    >
                      Watch ({watchCount})
                    </button>
                    <button
                      onClick={() => setCashierSevFilter((f) => (f === "ok" ? "all" : "ok"))}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
                        cashierSevFilter === "ok" ? "ring-2 ring-severity_healthy_text/40 shadow-sm" : ""
                      }`}
                    >
                      OK ({okCount})
                    </button>
                  </div>

                  {/* Column header + scrollable cashier rows + sticky avg footer */}
                  <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                    <div
                      className="sticky top-0 z-10 grid border-b border-gray-100 bg-gray-100"
                      style={{
                        gridTemplateColumns: "1fr 0.42fr 0.42fr 0.58fr",
                      }}
                    >
                      {(["Cashier", "Trans", "Qty", "Total"] as const).map(
                        (h, i) => (
                          <div
                            key={h}
                            className={`px-2 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 ${i > 0 ? "text-right" : ""}`}
                          >
                            {h}
                          </div>
                        ),
                      )}
                    </div>
                    {visibleGrades.map((g) => {
                      const isSel =
                        g.cashier_number === selectedCashier.cashier_number;
                      return (
                        <button
                          key={g.cashier_number}
                          onClick={() =>
                            handleCashierClick(g.cashier_number, g.store_number)
                          }
                          className={`w-full grid border-l-2 border-b border-b-[#1e2a4a]/15 transition-colors text-left ${
                            isSel
                              ? "bg-row_selected border-row_selected_border"
                              : "border-transparent hover:bg-gray-50"
                          }`}
                          style={{ gridTemplateColumns: "1fr 0.42fr 0.42fr 0.58fr" }}
                        >
                          <div className="px-2 py-[11px] flex items-center gap-1.5 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${CASHIER_DOT_CLASS[g.severity]}`} />
                            <span className="text-[13px] font-medium text-content truncate">
                              {g.cashier_name}
                            </span>
                          </div>
                          <div className="px-2 py-[11px] text-[13px] font-semibold text-content text-right tabular-nums">
                            {g.trans.value}
                          </div>
                          <div className="px-2 py-[11px] text-[13px] font-semibold text-content text-right tabular-nums">
                            {g.qty.value}
                          </div>
                          <div className="px-2 py-[11px] text-[13px] font-semibold text-content text-right tabular-nums">
                            {formatCurrency2(g.sales.value)}
                          </div>
                        </button>
                      );
                    })}
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
                    <div className="text-[12px] font-semibold text-content">
                      {selectedGrade.cashier_name}
                    </div>
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-content/40">
                      Cashier breakdown
                    </div>
                  </div>
                  <div
                    className={`flex-shrink-0 grid divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 ${isNoDollar ? "grid-cols-2" : "grid-cols-4"}`}
                  >
                    {scoreMetrics.map((m) => (
                      <StripCell
                        key={m.label}
                        label={m.label}
                        value={m.value}
                        baselineValue={m.baselineStr}
                        badge={<AvgBadge pct={m.pct} avg={m.avg} textSize="text-[10px]" />}
                        className="py-2.5 text-center"
                        valueClassName="text-[13px] font-bold text-content"
                      />
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
                      className="text-[12px] font-semibold text-[#1e2a4a] hover:text-[#1e2a4a]/70 transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
                  {/* Transaction component fills remaining space */}
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {isReceiptLoading ? (
                      <div className="flex-1 relative">
                        <LoadingIndicator message="Fetching transaction…" />
                      </div>
                    ) : receiptData ? (
                      <Transaction trans={receiptData} />
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  {/* Transaction list */}
                  <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                    {filteredOverviews.length === 0 &&
                    !fetchingCashierTransactions ? (
                      <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
                        {transactionLoadingMessage || "No transactions found"}
                      </div>
                    ) : (
                      <>
                        {/* Column filter headers */}
                        <div
                          className="grid sticky top-0 z-10 bg-gray-100 border-b border-gray-100"
                          style={{
                            gridTemplateColumns: "1fr 0.7fr 0.45fr 0.6fr",
                          }}
                        >
                          <div className="px-3 py-2">
                            <ColFilter
                              label="Trans ID"
                              active={!!appliedTransId}
                              appliedDisplay={appliedTransId}
                              onApply={() => setAppliedTransId(draftTransId)}
                              onClear={() => {
                                setAppliedTransId("");
                                setDraftTransId("");
                              }}
                            >
                              <input
                                autoFocus
                                style={inputStyle}
                                placeholder="Search ID…"
                                value={draftTransId}
                                onChange={(e) =>
                                  setDraftTransId(e.target.value)
                                }
                              />
                            </ColFilter>
                          </div>
                          <div className="px-3 py-2">
                            <ColFilter
                              label="Date"
                              active={!!saleDateFilter}
                              appliedDisplay={
                                saleDateFilter
                                  ? fmtDate(saleDateFilter)
                                  : undefined
                              }
                              onApply={() => {}}
                              onClear={() => dispatch(setSaleDateFilter(""))}
                            >
                              <SelectFilter
                                options={uniqueDates}
                                value={saleDateFilter}
                                onChange={(v) => dispatch(setSaleDateFilter(v))}
                                placeholder="All dates"
                                className="w-full"
                              />
                            </ColFilter>
                          </div>
                          <div className="px-3 py-2 flex justify-end">
                            <ColFilter
                              label="Qty"
                              active={!!appliedQty}
                              appliedDisplay={fmtThreshold(appliedQty)}
                              align="right"
                              onApply={() => setAppliedQty(draftQty)}
                              onClear={() => {
                                setAppliedQty(null);
                                setDraftQty(null);
                              }}
                            >
                              <ThresholdFilter
                                value={draftQty}
                                onChange={setDraftQty}
                                placeholder="Qty"
                                showOp
                                showClear
                                stretch
                                className="w-full"
                              />
                            </ColFilter>
                          </div>
                          <div className="px-3 py-2 flex justify-end">
                            <ColFilter
                              label="Total"
                              active={!!appliedSales}
                              appliedDisplay={fmtThreshold(appliedSales, "$")}
                              align="right"
                              onApply={() => setAppliedSales(draftSales)}
                              onClear={() => {
                                setAppliedSales(null);
                                setDraftSales(null);
                              }}
                            >
                              <ThresholdFilter
                                value={draftSales}
                                onChange={setDraftSales}
                                prefix="$"
                                placeholder="Sales"
                                showOp
                                showClear
                                stretch
                                className="w-full"
                              />
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
                              className="grid border-b border-b-[#1e2a4a]/15 hover:bg-gray-50 transition-colors"
                              style={{
                                gridTemplateColumns: "1fr 0.7fr 0.45fr 0.6fr",
                                background:
                                  i % 2 === 1
                                    ? "rgba(30,42,74,0.015)"
                                    : undefined,
                              }}
                            >
                              <button
                                onClick={() => handleRowClick(o)}
                                className="px-3 py-2 text-[13px] font-semibold text-[#1e2a4a] underline underline-offset-2 text-left truncate"
                              >
                                {o.transaction_id}
                              </button>
                              <div className="px-3 py-2 text-[13px] text-content">
                                {fmtDate(o.sale_date)}
                              </div>
                              <div className="px-3 py-2 text-[13px] text-content text-right tabular-nums">
                                {o.qty}
                              </div>
                              <div className="px-3 py-2 text-[13px] text-content text-right tabular-nums">
                                {formatCurrency2(o.total_sales)}
                              </div>
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
