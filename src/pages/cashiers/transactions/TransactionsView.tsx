import { useState } from "react";
import { useCashierCtx } from "..";
import { useCashiersActions } from "../hooks/useCashiersActions";
import { getCashierTransaction } from "../../../api/lossPrevention";
import type { JsonError, TransactionListItem, TransactionOverview } from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import Transaction from "./Transaction";

interface Props {
  onBack: () => void;
}

const fmtDate = (date: string) => {
  const [y, m, d] = date.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

const TransactionsView = ({ onBack }: Props) => {
  const ctx = useCashierCtx();
  const toast = useToast();
  const actions = useCashiersActions();
  const [selectedOverview, setSelectedOverview] = useState<TransactionOverview | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const transDrillDown = ctx.transDrillDown;
  const noTransactions = ctx.noTransactions;

const fetchReceipt = (overview: TransactionOverview) => {
    setSelectedOverview(overview);
    setLoadingReceipt(true);
    ctx.dispatch(actions.setTransDrillDown([]));
    ctx.dispatch(actions.setNoTransactions(false));


    const saleDate = overview.sale_date.split("T")[0];
    getCashierTransaction(ctx.url, ctx.token, saleDate, overview.sale_id, overview.storeid)
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
          ctx.dispatch(actions.setNoTransactions(false));
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

  const overviews = ctx.filteredTransOverviews;
  const receipt = transDrillDown[0];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header — always visible */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5" style={{ background: "#1e2a4a" }}>
        <div>
          <div className="text-[13px] font-medium text-white">{ctx.selectedSaleType}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
            {overviews.length} transactions
          </div>
        </div>
        <button
          onClick={onBack}
          className="text-[10px] px-2.5 py-1 rounded text-white/70 hover:text-white transition-colors"
          style={{ border: "0.5px solid rgba(255,255,255,0.2)" }}
        >
          ← Back
        </button>
      </div>

      {/* Body */}
      {ctx.fetchingTransactions ? (
        <div className="flex-1 relative">
          <LoadingIndicator message={ctx.transactionLoadingMessage} />
        </div>
      ) : ctx.noRowsFound ? (
        <div className="flex-1 flex items-center justify-center text-[13px] font-medium text-content/30">
          No transactions found for this date range
        </div>
      ) : selectedOverview ? (
        <div className="flex flex-1 min-h-0">
          {/* Collapsed list (130px) */}
          <div className="flex-shrink-0 flex flex-col border-r border-gray-100" style={{ width: 130 }}>
            <button
              onClick={() => setSelectedOverview(null)}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-2 text-[9px] font-medium border-b border-gray-100 hover:bg-gray-50 transition-colors"
              style={{ color: "#1e2a4a" }}
            >
              ← Go Back
            </button>
            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
              {overviews.map((ov) => {
                const isSelected = ov.transaction_id === selectedOverview.transaction_id;
                return (
                  <button
                    key={ov.transaction_id}
                    onClick={() => fetchReceipt(ov)}
                    className="w-full text-left px-2.5 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    style={{
                      borderLeft: isSelected ? "2.5px solid #1e2a4a" : "2.5px solid transparent",
                      background: isSelected ? "rgba(30,42,74,0.04)" : undefined,
                    }}
                  >
                    <div className="text-[10px] font-semibold truncate" style={{ color: isSelected ? "#1e2a4a" : "rgba(30,42,74,0.55)" }}>
                      {ov.transaction_id}
                    </div>
                    <div className="text-[8.5px] text-content/55 truncate mt-0.5">{ov.cashier_name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Receipt pane */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {loadingReceipt ? (
              <div className="flex-1 relative">
                <LoadingIndicator message="Loading receipt…" />
              </div>
            ) : noTransactions ? (
              <div className="flex-1 flex items-center justify-center text-[12px] text-content/40">
                No line items found for this transaction
              </div>
            ) : receipt ? (
              <Transaction trans={receipt} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[12px] text-content/40">
                Loading…
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Table column headers */}
          <div
            className="flex-shrink-0 grid px-4 py-2 bg-gray-50 border-b border-gray-100"
            style={{ gridTemplateColumns: "1fr 0.7fr 1.2fr 0.6fr 0.6fr 0.7fr" }}
          >
            {["Trans ID", "Date", "Cashier", "Store", "Qty", "Total"].map((h, i) => (
              <div
                key={h}
                className="text-[9px] font-semibold uppercase tracking-wide text-content/45"
                style={{ textAlign: i >= 4 ? "right" : "left" }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
            {overviews.map((ov, i) => (
              <div
                key={ov.transaction_id}
                className="grid px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer items-center"
                style={{
                  gridTemplateColumns: "1fr 0.7fr 1.2fr 0.6fr 0.6fr 0.7fr",
                  background: i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined,
                }}
                onClick={() => fetchReceipt(ov)}
              >
                <div className="text-[10px] font-semibold underline truncate" style={{ color: "#1e2a4a", textUnderlineOffset: 2 }}>
                  #{ov.transaction_id}
                </div>
                <div className="text-[10px] text-content/70">{fmtDate(ov.sale_date)}</div>
                <div className="text-[10px] text-content/70 truncate">{ov.cashier_name}</div>
                <div className="text-[10px] text-content/70">{ov.store_number}</div>
                <div className="text-[10px] text-content/70 text-right">{formatBigNumber(ov.qty, 0)}</div>
                <div className="text-[10px] font-medium text-content text-right">{formatCurrency2(ov.total_sales)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionsView;
