import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { formatDate, reduceTransactions } from "..";
import { gradeAllCashiers } from "../gradingUtils";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getCashierTransaction } from "../../../api/lossPrevention";
import { useLPState } from "../hooks/useLPState";
import { useLPActions } from "../hooks/useLPActions";
import type { JsonError, TransactionListItem, TransactionOverview } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import BottomSheet from "../../../components/BottomSheet";
import Transaction, { type TransactionHandle } from "../Transaction";
// import SelectFilter from "../../../components/filters/SelectFilter";
// import ThresholdFilter from "../../../components/filters/ThresholdFilter";
// import type { ThresholdValue } from "../../../components/filters/ThresholdFilter";

interface Props {
  onBack: () => void;
  onOpenSearch: () => void;
}

const fmtDate = (date: string) => {
  const [y, m, d] = date.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

// const meetsThreshold = (value: number, threshold: ThresholdValue | null): boolean => {
//   if (!threshold) return true;
//   if (threshold.op === "gt") return value > threshold.amount;
//   if (threshold.op === "lt") return value < threshold.amount;
//   return value === threshold.amount;
// };


const TransactionsMobile = ({ onBack }: Props) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const lp = useLPState();
  const actions = useLPActions();
  const assignedStores = useAppSelector((state) => state.user.assignedStores);

  const [filteredOverviews, setFilteredOverviews] = useState<TransactionOverview[]>([]);
  const [selectedOverview, setSelectedOverview] = useState<TransactionOverview | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [dateFilter, _] = useState("");
  // const [qtyThreshold, setQtyThreshold] = useState<ThresholdValue | null>(null);
  // const [salesThreshold, setSalesThreshold] = useState<ThresholdValue | null>(null);
  type SortCol = "date" | "qty" | "total";
  type SortDir = "desc" | "asc" | "none";
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("none");
  const receiptCloseRef = useRef<(() => void) | null>(null);
  const transactionRef = useRef<TransactionHandle>(null);

  const storeName = assignedStores.find((s) => s.storeid === lp.selectedStoreId)?.store_name ?? "";

  const grades = useMemo(
    () => gradeAllCashiers(lp.transOverviews, lp.baselineOverviews, lp.cashiers, lp.selectedSaleType),
    [lp.transOverviews, lp.baselineOverviews, lp.cashiers, lp.selectedSaleType],
  );

  const cashierGrade = grades.find((g) => g.cashier_number === lp.selectedCashier.cashier_number) ?? null;

  const peerAvgs = grades.length > 0 ? {
    trans:     grades[0].trans.avg,
    qty:       grades[0].qty.avg,
    sales:     grades[0].sales.avg,
    avgTicket: grades[0].avgTicket.avg,
  } : null;

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

  // const dateOptions = useMemo(() => {
  //   const dates = new Set(filteredOverviews.map((o) => o.sale_date.split("T")[0]));
  //   return Array.from(dates).sort((a, b) => b.localeCompare(a)).map((d) => ({ value: d, label: fmtDate(d) }));
  // }, [filteredOverviews]);

  const visible = useMemo(() => {
    const filtered = filteredOverviews.filter((ov) => {
      if (dateFilter && ov.sale_date.split("T")[0] !== dateFilter) return false;
      // if (!meetsThreshold(ov.qty ?? 0, qtyThreshold)) return false;
      // if (!meetsThreshold(ov.total_sales, salesThreshold)) return false;
      return true;
    });
    if (!sortCol || sortDir === "none") return filtered;
    return [...filtered].sort((a, b) => {
      let av = 0, bv = 0;
      if (sortCol === "date") { av = new Date(a.sale_date).getTime(); bv = new Date(b.sale_date).getTime(); }
      if (sortCol === "qty")  { av = a.qty ?? 0; bv = b.qty ?? 0; }
      if (sortCol === "total") { av = a.total_sales; bv = b.total_sales; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [filteredOverviews, dateFilter, sortCol, sortDir]);

  const receipt = lp.transactionDrillDown[0] ?? null;


  const handleRowTap = (ov: TransactionOverview) => {
    setSelectedOverview(ov);
    setLoadingReceipt(true);
    dispatch(actions.setTransactionDrillDown([]));
    const saleDate = ov.sale_date.split("T")[0];
    getCashierTransaction(context.url, context.token, saleDate, ov.sale_id, ov.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && j.transaction.length > 0) {
          const transactions: TransactionListItem[] = j.transaction.map((item: any) => ({ ...item, transaction_id: item.sale_id.split("-")[1], qty: item.qty ?? 0 }));
          dispatch(actions.setTransactionDrillDown([reduceTransactions(transactions)]));
        }
      })
      .catch((err: JsonError) => { dispatch(actions.setTransModalOpen(false)); toast.error("Error fetching transaction: " + err.message); })
      .finally(() => setLoadingReceipt(false));
  };

  const handleCloseReceipt = () => {
    setSelectedOverview(null);
    dispatch(actions.setTransactionDrillDown([]));
  };

  const cashierName = lp.cashiers.find((c) => c.cashier_number === lp.selectedCashier.cashier_number)?.cashier_name ?? "";
  const noSale = lp.selectedSaleType.toLowerCase().replace(/[^a-z]/g, "") === "nosale";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex items-start gap-3 flex-shrink-0">
        <button onClick={onBack} className="text-white/75 mt-0.5 flex-shrink-0">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-white font-semibold text-[15px] truncate">{cashierName} <span className="text-white/45 font-normal text-[12px]">#{lp.selectedCashier.cashier_number}</span> <span className="text-white/50 font-normal text-[11px]">— {lp.selectedSaleType} Activity</span></div>
          {storeName && <div className="text-white/45 text-[10px] mt-0.5">{storeName}</div>}
        </div>
      </div>

      {/* Cashier Totals strip */}
      {cashierGrade && (
        <>
          <div className="flex-shrink-0 px-3 py-[9px] bg-gray-100 border-b border-gray-200 flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-content/50">Cashier Totals</span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1"><div className="w-[6px] h-[6px] rounded-[2px] bg-emerald-400 flex-shrink-0" /><span className="text-[9px] font-semibold uppercase tracking-wide text-content/50">below avg</span></div>
              <div className="flex items-center gap-1"><div className="w-[6px] h-[6px] rounded-[2px] bg-red-400 flex-shrink-0" /><span className="text-[9px] font-semibold uppercase tracking-wide text-content/50">above avg</span></div>
            </div>
          </div>
          <div className="flex-shrink-0 grid divide-x divide-gray-100 bg-white border-b border-gray-100"
            style={{ gridTemplateColumns: noSale ? "repeat(2, 1fr)" : "repeat(4, 1fr)" }}
          >
            {[
              { label: "Trans",      value: cashierGrade.trans.value.toLocaleString(),               pct: cashierGrade.trans.pct },
              { label: "Items",      value: cashierGrade.qty.value.toLocaleString(),                 pct: cashierGrade.qty.pct },
              ...(!noSale ? [
                { label: "Total",      value: formatCurrency2(Math.abs(cashierGrade.sales.value)),     pct: cashierGrade.sales.pct },
                { label: "Avg ticket", value: formatCurrency2(Math.abs(cashierGrade.avgTicket.value)), pct: cashierGrade.avgTicket.pct },
              ] : []),
            ].map(({ label, value, pct }) => (
              <div key={label} className="px-3 py-2">
                <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">{label}</div>
                <div className="text-[12px] font-semibold text-content mt-0.5">{value}</div>
                <span
                  className="inline-flex items-center gap-0.5 text-[7.5px] font-bold px-1.5 py-0.5 rounded mt-1"
                  style={pct > 0
                    ? { background: "rgba(220,38,38,0.09)", color: "#dc2626" }
                    : { background: "rgba(22,163,74,0.09)", color: "#16a34a" }}
                >
                  {pct > 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% avg
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Store Averages strip */}
      {peerAvgs && (
        <>
          <div className="flex-shrink-0 px-3 py-[9px] bg-gray-100 border-b border-gray-200 flex items-center">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-content/50">Store Averages</span>
          </div>
          <div className="flex-shrink-0 grid divide-x divide-gray-100 bg-white border-b border-gray-100"
            style={{ gridTemplateColumns: noSale ? "repeat(2, 1fr)" : "repeat(4, 1fr)" }}
          >
            <div className="px-3 py-2"><div className="text-[9px] font-medium uppercase tracking-wide text-content/70">Trans</div><div className="text-[12px] font-semibold text-content mt-0.5">{Math.round(peerAvgs.trans).toLocaleString()}</div></div>
            <div className="px-3 py-2"><div className="text-[9px] font-medium uppercase tracking-wide text-content/70">Items</div><div className="text-[12px] font-semibold text-content mt-0.5">{Math.round(peerAvgs.qty).toLocaleString()}</div></div>
            {!noSale && <div className="px-3 py-2"><div className="text-[9px] font-medium uppercase tracking-wide text-content/70">Total</div><div className="text-[12px] font-semibold text-content mt-0.5">{formatCurrency2(Math.abs(peerAvgs.sales))}</div></div>}
            {!noSale && <div className="px-3 py-2"><div className="text-[9px] font-medium uppercase tracking-wide text-content/70">Avg ticket</div><div className="text-[12px] font-semibold text-content mt-0.5">{formatCurrency2(Math.abs(peerAvgs.avgTicket))}</div></div>}
          </div>
        </>
      )}

      {/* Filters — commented out for mobile drill-down flow */}
      {/* <div className="flex-shrink-0 border-b border-gray-100 bg-white px-3 py-2 grid grid-cols-2 gap-2">
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
      </div> */}

      {/* Column headers — Date, Qty, Total are sortable */}
      <div className="flex-shrink-0 grid px-4 py-2 bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: "1fr 0.6fr 0.55fr 0.7fr" }}>
        <div className="text-[9px] font-semibold uppercase tracking-wide text-content/45">Trans ID</div>
        {(["date", "qty", "total"] as SortCol[]).map((col) => {
          const label = col === "date" ? "Date" : col === "qty" ? "Items" : "Total";
          const isActive = sortCol === col && sortDir !== "none";
          const arrow = isActive ? (sortDir === "desc" ? " ▼" : " ▲") : "";
          return (
            <button
              key={col}
              onClick={() => {
                if (sortCol !== col) { setSortCol(col); setSortDir("desc"); }
                else if (sortDir === "desc") setSortDir("asc");
                else if (sortDir === "asc") { setSortDir("none"); setSortCol(null); }
              }}
              className={`text-[9px] font-semibold uppercase tracking-wide text-right ${isActive ? "text-[#1e2a4a]" : "text-content/45"}`}
            >
              {label}{arrow}
            </button>
          );
        })}
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
              <>
                <div className="flex-shrink-0 flex items-center justify-end gap-1.5 px-4 py-2 border-b border-gray-100 bg-white">
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
                <Transaction ref={transactionRef} trans={receipt} />
              </>
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default TransactionsMobile;
