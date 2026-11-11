// Utils
import { formatCurrency2 } from "../../../../../utils";
import { CASHIER_DOT_CLASS } from "../utils";

// Interfaces
import type { Dispatch, SetStateAction } from "react";
import type { CashierGrade, CashierSeverity } from "../../interfaces";

interface CashierListProps {
  fetchingCashierTransactions: boolean;
  cashierGrades: CashierGrade[];
  visibleGrades: CashierGrade[];
  critCount: number;
  watchCount: number;
  okCount: number;
  cashierSevFilter: CashierSeverity | "all";
  setCashierSevFilter: Dispatch<SetStateAction<CashierSeverity | "all">>;
  selectedCashier: { cashier_number: number };
  onCashierClick: (cashier_number: number, store_number: string) => void;
}

/** The left side: the store's cashiers, graded, with grade chips. */
const CashierList = ({
  fetchingCashierTransactions,
  cashierGrades,
  visibleGrades,
  critCount,
  watchCount,
  okCount,
  cashierSevFilter,
  setCashierSevFilter,
  selectedCashier,
  onCashierClick,
}: CashierListProps) => {
  return (
    <div
      className="flex flex-col border-r border-line_hair"
      style={{ width: 286, flexShrink: 0 }}
    >
      {fetchingCashierTransactions && cashierGrades.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[10px] text-content/95">
          Loading cashiers…
        </div>
      ) : cashierGrades.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[10px] text-content/95">
          No cashier data
        </div>
      ) : (
        <>
          {/* Severity filter chips */}
          <div className="flex-shrink-0 flex items-center gap-1.5 p-2 border-b border-line_hair bg-gray-100">
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
              className="sticky top-0 z-10 grid border-b border-line_hair bg-gray-100"
              style={{
                gridTemplateColumns: "1fr 0.42fr 0.42fr 0.58fr",
              }}
            >
              {(["Cashier", "Trans", "Qty", "Total"] as const).map(
                (h, i) => (
                  <div
                    key={h}
                    className={`px-2 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/95 ${i > 0 ? "text-right" : ""}`}
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
                  onClick={() => onCashierClick(g.cashier_number, g.store_number)}
                  className={`w-full grid border-l-2 border-b border-b-brand_navy/15 transition-colors text-left ${
                    isSel
                      ? "bg-row_selected border-row_selected_border"
                      : "border-transparent hover:bg-fill_soft"
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
  );
};

export default CashierList;
