import { useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useCashierCtx } from "..";
import type { JsonError, TransactionListItem, TransactionOverview } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import BottomSheet from "../../../components/BottomSheet";
import Transaction from "../transactions/Transaction";
import { getCashierTransaction } from "../../../api/lossPrevention";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useCashiersActions } from "../hooks/useCashiersActions";
import SelectFilter from "../../../components/filters/SelectFilter";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import type { ThresholdValue } from "../../../components/filters/ThresholdFilter";

interface Props {
  onBack: () => void;
  onOpenSearch: () => void;
  cashierName?: string;
  storeName?: string;
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

const TransactionsMobileScreen = ({ onBack, onOpenSearch, cashierName, storeName }: Props) => {
  const ctx = useCashierCtx();
  const toast = useToast();
  const actions = useCashiersActions();
  const [selectedOverview, setSelectedOverview] = useState<TransactionOverview | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [cashierFilter, setCashierFilter] = useState("");
  const [qtyThreshold, setQtyThreshold] = useState<ThresholdValue | null>(null);
  const [salesThreshold, setSalesThreshold] = useState<ThresholdValue | null>(null);
  const receiptCloseRef = useRef<(() => void) | null>(null);

  const receipt = ctx.transDrillDown[0] ?? null;

  const dateOptions = useMemo(() => {
    const dates = new Set(ctx.filteredTransOverviews.map((o) => o.sale_date.split("T")[0]));
    return Array.from(dates)
      .sort((a, b) => b.localeCompare(a))
      .map((d) => ({ value: d, label: fmtDate(d) }));
  }, [ctx.filteredTransOverviews]);

  const cashierOptions = useMemo(() => {
    const seen = new Map<number, string>();
    ctx.filteredTransOverviews.forEach((o) => {
      if (!seen.has(o.cashier_number)) seen.set(o.cashier_number, o.cashier_name);
    });
    return Array.from(seen.entries()).map(([num, name]) => ({ value: String(num), label: name }));
  }, [ctx.filteredTransOverviews]);

  const visible = useMemo(() => {
    return ctx.filteredTransOverviews.filter((ov) => {
      if (dateFilter && ov.sale_date.split("T")[0] !== dateFilter) return false;
      if (cashierFilter && String(ov.cashier_number) !== cashierFilter) return false;
      if (!meetsThreshold(ov.qty, qtyThreshold)) return false;
      if (!meetsThreshold(ov.total_sales, salesThreshold)) return false;
      return true;
    });
  }, [ctx.filteredTransOverviews, dateFilter, cashierFilter, qtyThreshold, salesThreshold]);

  const totalSales = visible.reduce((s, o) => s + o.total_sales, 0);
  const totalQty   = visible.reduce((s, o) => s + o.qty, 0);

  const handleTxRowTap = (ov: TransactionOverview) => {
    setSelectedOverview(ov);
    setLoadingReceipt(true);
    ctx.dispatch(actions.setTransDrillDown([]));
    ctx.dispatch(actions.setNoTransactions(false));

    const saleDate = ov.sale_date.split("T")[0];
    getCashierTransaction(ctx.url, ctx.token, saleDate, ov.sale_id, ov.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && j.transaction.length > 0) {
          const transactions: TransactionListItem[] = [...j.transaction].map((item) => ({
            ...item,
            transaction_id: item.sale_id.split("-")[1],
            qty: item.qty ?? 0,
          }));
          const reduced = transactions.reduce((acc: TransactionListItem[], curr) => {
            const found = acc.find(
              (item) =>
                item.storeid === curr.storeid &&
                item.sale_type === curr.sale_type &&
                item.product_code === curr.product_code &&
                item.product_description === curr.product_description,
            );
            if (found) {
              found.qty! += curr.qty!;
              found.total_sales += curr.total_sales;
              found.net_sales += curr.net_sales;
              found.total_rounded_tax += curr.total_rounded_tax;
            } else {
              acc.push({ ...curr });
            }
            return acc;
          }, []);
          ctx.dispatch(actions.setTransDrillDown([reduced]));
        } else {
          ctx.dispatch(actions.setNoTransactions(true));
        }
      })
      .catch((err: JsonError) => {
        ctx.dispatch(actions.setTransModalOpen(false));
        toast.error("Error fetching transaction: " + err.message);
      })
      .finally(() => setLoadingReceipt(false));
  };

  const handleCloseReceipt = () => {
    setSelectedOverview(null);
    ctx.dispatch(actions.setTransDrillDown([]));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex-shrink-0">
        <div className="relative flex items-center justify-center mb-2">
          <button
            onClick={onBack}
            className="absolute left-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
            aria-label="Back"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </button>
          <div className="text-center px-8">
            <div className="text-white font-medium text-[13px]">
              {cashierName ? `${cashierName} – ${ctx.selectedSaleType}` : ctx.selectedSaleType}
            </div>
            {storeName && <div className="text-white/60 text-[10px] mt-0.5">{storeName}</div>}
          </div>
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="absolute right-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: "Trans", value: visible.length.toLocaleString() },
            { label: "Qty",   value: totalQty.toLocaleString() },
            { label: "Total", value: formatCurrency2(totalSales) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="text-[10px] text-white/50">{label}</div>
              <div className="text-[12px] font-medium text-white mt-0.5 truncate">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      {cashierName ? (
        /* Cashier mode — 3-col single row */
        <div className="flex-shrink-0 border-b border-gray-100 bg-white px-3 py-2 grid grid-cols-3 gap-2">
          <SelectFilter options={dateOptions} value={dateFilter} onChange={setDateFilter} placeholder="All dates" className="w-full" />
          <ThresholdFilter value={salesThreshold} onChange={setSalesThreshold} prefix="$" showOp showClear placeholder="Sales" stretch className="w-full" />
          <ThresholdFilter value={qtyThreshold} onChange={setQtyThreshold} suffix="qty" showOp showClear placeholder="Qty" stretch className="w-full" />
        </div>
      ) : (
        /* Store mode — 2×2 grid */
        <div className="flex-shrink-0 border-b border-gray-100 bg-white px-3 py-2 grid grid-cols-2 gap-2">
          <SelectFilter options={dateOptions} value={dateFilter} onChange={setDateFilter} placeholder="All dates" className="w-full" />
          <SelectFilter options={cashierOptions} value={cashierFilter} onChange={setCashierFilter} placeholder="All cashiers" className="w-full" />
          <ThresholdFilter value={salesThreshold} onChange={setSalesThreshold} prefix="$" showOp showClear placeholder="Sales" stretch className="w-full" />
          <ThresholdFilter value={qtyThreshold} onChange={setQtyThreshold} suffix="qty" showOp showClear placeholder="Qty" stretch className="w-full" />
        </div>
      )}

      {/* Column headers */}
      <div className="flex-shrink-0 grid px-4 py-2 bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: "1fr 0.6fr 0.55fr 0.7fr" }}>
        {["Trans ID", "Date", "Qty", "Total"].map((h, i) => (
          <div key={h} className="text-[9px] font-semibold uppercase tracking-wide text-content/45" style={{ textAlign: i > 0 ? "right" : "left" }}>{h}</div>
        ))}
      </div>

      {/* Transaction rows */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {ctx.fetchingTransactions && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">Loading transactions…</div>
        )}
        {!ctx.fetchingTransactions && ctx.noRowsFound && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">No transactions found.</div>
        )}
        {!ctx.fetchingTransactions && !ctx.noRowsFound && visible.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">No transactions match filters.</div>
        )}
        {!ctx.fetchingTransactions && visible.map((ov, i) => (
          <button
            key={ov.transaction_id}
            onClick={() => handleTxRowTap(ov)}
            className="w-full grid px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            style={{
              gridTemplateColumns: "1fr 0.6fr 0.55fr 0.7fr",
              background: i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined,
            }}
          >
            <span className="text-[12px] font-semibold underline truncate" style={{ color: "#1e2a4a", textUnderlineOffset: 2 }}>
              #{ov.transaction_id}
            </span>
            <span className="text-[12px] text-content/70 text-right">{fmtDate(ov.sale_date)}</span>
            <span className="text-[12px] text-content/70 text-right">{(ov.qty).toLocaleString()}</span>
            <span className="text-[12px] font-medium text-content text-right">{formatCurrency2(ov.total_sales)}</span>
          </button>
        ))}
      </div>

      {/* Receipt BottomSheet */}
      {selectedOverview && (
        <BottomSheet onClose={handleCloseReceipt} closeRef={receiptCloseRef}>
          {loadingReceipt ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-content/70">Loading receipt…</div>
          ) : ctx.noTransactions ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-content/70">No line items found.</div>
          ) : receipt ? (
            <div className="flex flex-col" style={{ maxHeight: "80vh" }}>
              <Transaction trans={receipt} />
            </div>
          ) : null}
        </BottomSheet>
      )}
    </div>
  );
};

export default TransactionsMobileScreen;
