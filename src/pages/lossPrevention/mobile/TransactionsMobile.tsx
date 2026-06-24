import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { formatDate, reduceTransactions } from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getCashierTransaction } from "../../../api/lossPrevention";
import {
  setCashierSaleIds,
  setSelectedCashier,
  setTransactionDrillDown,
  setTransModalOpen,
} from "../../../features/lossPreventionSlice";
import type { JsonError, TransactionListItem, TransactionOverview } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import BottomSheet from "../../../components/BottomSheet";
import Transaction from "../Transaction";
import SelectFilter from "../../../components/filters/SelectFilter";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import type { ThresholdValue } from "../../../components/filters/ThresholdFilter";

interface Props {
  onBack: () => void;
  onOpenSearch: () => void;
}

const fmtDate = (date: string) => {
  const [y, m, d] = date.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

const meetsThreshold = (value: number, threshold: ThresholdValue | null): boolean => {
  if (!threshold) return true;
  if (threshold.op === "gt") return value > threshold.amount;
  if (threshold.op === "lt") return value < threshold.amount;
  return value === threshold.amount;
};

const pctDelta = (current: number, trend: number): { pct: number; up: boolean } | null => {
  const a = Math.abs(current);
  const b = Math.abs(trend);
  if (b === 0) return null;
  const pct = ((a - b) / b) * 100;
  return { pct: Math.abs(pct), up: pct > 0 };
};

const TransactionsMobile = ({ onBack, onOpenSearch }: Props) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const lp = useAppSelector((state) => state.lossPrevention);
  const assignedStores = useAppSelector((state) => state.user.assignedStores);

  const [filteredOverviews, setFilteredOverviews] = useState<TransactionOverview[]>([]);
  const [selectedOverview, setSelectedOverview] = useState<TransactionOverview | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [qtyThreshold, setQtyThreshold] = useState<ThresholdValue | null>(null);
  const [salesThreshold, setSalesThreshold] = useState<ThresholdValue | null>(null);
  const receiptCloseRef = useRef<(() => void) | null>(null);

  const storeName = assignedStores.find((s) => s.storeid === lp.selectedStoreId)?.store_name ?? "";

  // detail/trend for the 5 KPI strip — use first entry (we narrowed to selected store before navigating)
  const detail = lp.cashierDetails[0] ?? null;
  const trend  = lp.cashierTrends[0] ?? null;

  const kpiMetrics = detail ? [
    { label: "Trans",    current: detail.transaction_count, trendVal: trend?.transaction_count,  fmt: (v: number) => String(v),   isGood: (c: number, t: number) => c < t },
    { label: "Items",    current: detail.total_items,       trendVal: trend?.total_items,         fmt: (v: number) => String(v),   isGood: (c: number, t: number) => c < t },
    { label: "Total",    current: detail.amount,            trendVal: trend?.amount,              fmt: formatCurrency2,             isGood: (c: number, t: number) => Math.abs(c) < Math.abs(t) },
    { label: "Avg $",    current: detail.average_dollars,   trendVal: trend?.average_dollars,     fmt: formatCurrency2,             isGood: (c: number, t: number) => Math.abs(c) < Math.abs(t) },
  ] : null;

  // filter logic (preserving original LP slice filter fields)
  useEffect(() => {
    const selectedCashierNum = lp.selectedCashier.cashier_number;
    const saleDate = lp.saleDateFilter;
    const transId = lp.transIdFilter.toLowerCase();
    const sales = lp.salesThreshold;
    const qty = lp.qtyThreshold;

    if (!selectedCashierNum && !saleDate && !transId && !sales && !qty) {
      setFilteredOverviews(lp.transOverviews);
      return;
    }
    setFilteredOverviews(lp.transOverviews.filter((item) => {
      const matchCashier  = selectedCashierNum ? item.cashier_number === selectedCashierNum : true;
      const matchDate     = formatDate(item.sale_date).includes(saleDate);
      const matchTransId  = item.transaction_id !== null ? item.transaction_id.toLowerCase().includes(transId) : true;
      const matchSales    = sales ? (sales.op === "gt" ? item.total_sales > sales.amount : sales.op === "lt" ? item.total_sales < sales.amount : item.total_sales === sales.amount) : true;
      const matchQty      = qty   ? (qty.op   === "gt" ? (item.qty ?? 0)  > qty.amount   : qty.op   === "lt" ? (item.qty ?? 0)  < qty.amount   : (item.qty ?? 0)  === qty.amount)  : true;
      return matchCashier && matchDate && matchTransId && matchSales && matchQty;
    }));
  }, [lp.transOverviews, lp.selectedCashier, lp.saleDateFilter, lp.salesThreshold, lp.transIdFilter, lp.qtyThreshold]);

  const dateOptions = useMemo(() => {
    const dates = new Set(filteredOverviews.map((o) => o.sale_date.split("T")[0]));
    return Array.from(dates).sort((a, b) => b.localeCompare(a)).map((d) => ({ value: d, label: fmtDate(d) }));
  }, [filteredOverviews]);

  const visible = useMemo(() => filteredOverviews.filter((ov) => {
    if (dateFilter && ov.sale_date.split("T")[0] !== dateFilter) return false;
    if (!meetsThreshold(ov.qty ?? 0, qtyThreshold)) return false;
    if (!meetsThreshold(ov.total_sales, salesThreshold)) return false;
    return true;
  }), [filteredOverviews, dateFilter, qtyThreshold, salesThreshold]);

  const receipt = lp.transactionDrillDown[0] ?? null;


  const handleRowTap = (ov: TransactionOverview) => {
    setSelectedOverview(ov);
    setLoadingReceipt(true);
    dispatch(setTransactionDrillDown([]));
    const saleDate = ov.sale_date.split("T")[0];
    getCashierTransaction(context.url, context.token, saleDate, ov.sale_id, ov.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && j.transaction.length > 0) {
          const transactions: TransactionListItem[] = j.transaction.map((item: any) => ({ ...item, transaction_id: item.sale_id.split("-")[1], qty: item.qty ?? 0 }));
          dispatch(setTransactionDrillDown([reduceTransactions(transactions)]));
        }
      })
      .catch((err: JsonError) => { dispatch(setTransModalOpen(false)); toast.error("Error fetching transaction: " + err.message); })
      .finally(() => setLoadingReceipt(false));
  };

  const handleCloseReceipt = () => {
    setSelectedOverview(null);
    dispatch(setTransactionDrillDown([]));
  };

  const title = lp.selectedSaleType;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex-shrink-0">
        <div className="relative flex items-center justify-center mb-2">
          <button
            onClick={onBack}
            className="absolute left-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </button>
          <div className="text-center px-8">
            <div className="text-white font-medium text-[13px]">{title} Transactions</div>
            {storeName && <div className="text-white/60 text-[10px] mt-0.5">{storeName}</div>}
          </div>
          <button
            onClick={onOpenSearch}
            className="absolute right-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 KPI tiles */}
        {kpiMetrics ? (
          <div className="grid grid-cols-4 gap-1">
            {kpiMetrics.map(({ label, current, trendVal, fmt, isGood }) => {
              const delta = trendVal != null ? pctDelta(current, trendVal) : null;
              const good = delta && isGood ? isGood(current, trendVal!) : null;
              const deltaColor = good ? "#34d399" : "#f87171";
              return (
                <div key={label} className="rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <span className="text-[8px] text-white/50">{label}</span>
                    {delta ? (
                      <span className="text-[7px] font-medium flex-shrink-0" style={{ color: deltaColor }}>
                        {delta.up ? "▲" : "▼"}{delta.pct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-[7px] text-white/20">–</span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-white truncate">{fmt(current)}</div>
                  {trendVal != null ? (
                    <div className="text-[7px] text-white/35 mt-0.5">vs {fmt(trendVal)}</div>
                  ) : (
                    <div className="text-[7px] text-white/20 mt-0.5">–</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: "Trans", value: visible.length.toLocaleString() },
              { label: "Qty",   value: visible.reduce((s, o) => s + (o.qty ?? 0), 0).toLocaleString() },
              { label: "Total", value: formatCurrency2(visible.reduce((s, o) => s + o.total_sales, 0)) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="text-[10px] text-white/50">{label}</div>
                <div className="text-[12px] font-medium text-white mt-0.5 truncate">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters — 2×2 even grid */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-3 py-2 grid grid-cols-2 gap-2">
        <SelectFilter options={dateOptions} value={dateFilter} onChange={setDateFilter} placeholder="All dates" className="w-full" />
        <SelectFilter
          options={lp.cashiers.map((c) => ({ value: String(c.cashier_number), label: `${c.cashier_name} (${c.transaction_count})` }))}
          value={lp.selectedCashier.cashier_number ? String(lp.selectedCashier.cashier_number) : ""}
          onChange={(v) => {
            if (!v) {
              dispatch(setCashierSaleIds([]));
              dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
            } else {
              const c = lp.cashiers.find((c) => String(c.cashier_number) === v);
              if (c) dispatch(setSelectedCashier({ cashier_number: c.cashier_number, store_number: c.store_number }));
            }
          }}
          placeholder="All cashiers"
          className="w-full"
        />
        <ThresholdFilter value={salesThreshold} onChange={setSalesThreshold} prefix="$" showOp showClear placeholder="Sales" stretch className="w-full" />
        <ThresholdFilter value={qtyThreshold} onChange={setQtyThreshold} suffix="qty" showOp showClear placeholder="Qty" stretch className="w-full" />
      </div>

      {/* Column headers */}
      <div className="flex-shrink-0 grid px-4 py-2 bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: "1fr 0.6fr 0.55fr 0.7fr" }}>
        {["Trans ID", "Date", "Qty", "Total"].map((h, i) => (
          <div key={h} className="text-[9px] font-semibold uppercase tracking-wide text-content/45" style={{ textAlign: i > 0 ? "right" : "left" }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {lp.fetchingCashierTransactions && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">{lp.transactionLoadingMessage || "Loading…"}</div>
        )}
        {!lp.fetchingCashierTransactions && visible.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">No transactions match filters.</div>
        )}
        {!lp.fetchingCashierTransactions && visible.map((ov, i) => (
          <button
            key={ov.transaction_id}
            onClick={() => handleRowTap(ov)}
            className="w-full grid px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            style={{ gridTemplateColumns: "1fr 0.6fr 0.55fr 0.7fr", background: i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined }}
          >
            <span className="text-[12px] font-semibold underline truncate" style={{ color: "#1e2a4a", textUnderlineOffset: 2 }}>#{ov.transaction_id}</span>
            <span className="text-[12px] text-content/70 text-right">{fmtDate(ov.sale_date)}</span>
            <span className="text-[12px] text-content/70 text-right">{(ov.qty ?? 0).toLocaleString()}</span>
            <span className="text-[12px] font-medium text-content text-right">{formatCurrency2(ov.total_sales)}</span>
          </button>
        ))}
      </div>

      {/* Receipt BottomSheet */}
      {selectedOverview && (
        <BottomSheet onClose={handleCloseReceipt} closeRef={receiptCloseRef}>
          <div className="flex flex-col" style={{ maxHeight: "80vh" }}>
            {loadingReceipt ? (
              <div className="flex items-center justify-center py-16 text-[12px] text-content/70">Loading receipt…</div>
            ) : !receipt ? (
              <div className="flex items-center justify-center py-16 text-[12px] text-content/70">No line items found.</div>
            ) : (
              <Transaction trans={receipt} />
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default TransactionsMobile;
