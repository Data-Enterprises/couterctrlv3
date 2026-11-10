// Hooks
import { useMemo, useState } from "react";
import { useAppDispatch, useStoreName } from "../../../../hooks";
import { useLossPreventionCtx } from "../hooks";

// Redux
import {
  setSaleDateFilter,
  setSelectedCashier,
  setCashierSaleIds,
} from "../../../../features/dev/devLossPreventionSlice";

// Utils
import {
  gradeAllCashiers,
  matchWeekday,
  isNoDollarType,
  storeSeverity,
  weekRangeLabel,
  weekRangeFilename,
} from "../utils/grading";
import { buildKpiMetrics, buildScoreMetrics, fmtDate } from "./utils";

// Interfaces
import type {
  TransactionListItem,
  TransactionOverview,
  ThresholdValue,
} from "../../../../interfaces";
import type { CashierSeverity } from "../interfaces";

// Components
import EmptyPrompt from "../../../../components-dev/EmptyPrompt";
import LPDayCards from "../components/LPDayCards";
import LPExportModal from "../export/LPExportModal";
import TransactionTitleBar from "./components/TransactionTitleBar";
import StoreKpiStrip from "./components/StoreKpiStrip";
import CashierList from "./components/CashierList";
import CashierScoreStrip from "./components/CashierScoreStrip";
import ReceiptView from "./components/ReceiptView";
import TransactionFilters from "./components/TransactionFilters";
import TransactionRows from "./components/TransactionRows";

interface LPTransactionPanelProps {
  onTransactionClick: (overview: TransactionOverview) => void;
  onShowAll: (filtered: TransactionListItem[]) => void;
}

/** The open store's LP report: its figures, its days, its graded cashiers and
 *  their transactions or one receipt. */
const LPTransactionPanel = ({ onTransactionClick }: LPTransactionPanelProps) => {
  const dispatch = useAppDispatch();
  const cashier = useLossPreventionCtx();
  const { search } = cashier;

  const [selectedOverview, setSelectedOverview] =
    useState<TransactionOverview | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [cashierSevFilter, setCashierSevFilter] = useState<CashierSeverity | "all">("all");
  // What is typed in each column filter, applied only on Apply. Kept here so
  // it survives the filter row unmounting while a receipt is open.
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

  /** The cashier list follows the day strip, same as the transaction list.
   *
   *  Both sides of the comparison have to narrow together. Grading compares
   *  totals against a baseline scaled by how many current-length periods it
   *  spans, so a single day is judged against the *same weekday* in the
   *  baseline — two Thursdays, not a flat daily average. Narrowing only the
   *  current side would leave a day's totals measured against a week's, and
   *  every cashier would pass no matter what they did.
   *
   *  The `cashiers` fallback is dropped on a day view: it back-fills anyone
   *  missing from the overviews with their **week** totals, which would invent
   *  a full week of activity for someone who never worked that day. The list
   *  then shows exactly who rang that day, matching the transactions beside
   *  it. */
  const cashierGrades = useMemo(() => {
    if (!saleDateFilter) {
      return gradeAllCashiers(
        transOverviews,
        cashier.baselineOverviews,
        cashiers,
        selectedSaleType,
      );
    }

    const dayOverviews = transOverviews.filter(
      (o) => o.sale_date.split("T")[0] === saleDateFilter,
    );
    const { overviews: dayBaseline, periods } = matchWeekday(
      cashier.baselineOverviews,
      saleDateFilter,
    );

    return gradeAllCashiers(
      dayOverviews,
      dayBaseline,
      [],
      selectedSaleType,
      periods,
    );
  }, [
    transOverviews,
    cashier.baselineOverviews,
    cashiers,
    selectedSaleType,
    saleDateFilter,
  ]);

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

  const kpiMetrics = buildKpiMetrics(detail, baselineDetail, isNoDollar);
  const scoreMetrics = buildScoreMetrics(selectedGrade, isNoDollar);

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
          <TransactionTitleBar
            tier={tier}
            storeName={storeName}
            selectedSaleType={selectedSaleType}
            dateLabel={dateLabel}
            canExport={transOverviews.length > 0 && !fetchingCashierTransactions}
            onExport={() => setExportOpen(true)}
          />

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
          {kpiMetrics && <StoreKpiStrip kpiMetrics={kpiMetrics} />}

          {/* Day-of-week strip — filters the transaction list and grades each
              day against the same weekday in the two baseline weeks. */}
          <LPDayCards
            overviews={transOverviews}
            baseline={cashier.baselineOverviews}
            selectedDate={saleDateFilter}
            onSelect={(d) => dispatch(setSaleDateFilter(d))}
            hasAmount={!isNoDollar}
          />

          {/* Split body */}
          <div className="flex flex-1 min-h-0">
            {/* Left: cashier list */}
              <CashierList
                fetchingCashierTransactions={fetchingCashierTransactions}
                cashierGrades={cashierGrades}
                visibleGrades={visibleGrades}
                critCount={critCount}
                watchCount={watchCount}
                okCount={okCount}
                cashierSevFilter={cashierSevFilter}
                setCashierSevFilter={setCashierSevFilter}
                selectedCashier={selectedCashier}
                onCashierClick={handleCashierClick}
              />

            {/* Right: score strip + transaction list / receipt */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              {/* Cashier score strip — always visible when a cashier is selected */}
              {scoreMetrics && selectedGrade && (
                <CashierScoreStrip
                  selectedGrade={selectedGrade}
                  scoreMetrics={scoreMetrics}
                  isNoDollar={isNoDollar}
                />
              )}

              {isReceiptMode ? (
                <ReceiptView
                  isReceiptLoading={isReceiptLoading}
                  receiptData={receiptData}
                  onBack={() => setSelectedOverview(null)}
                />
              ) : (
                <>
                  {/* Transaction list */}
                  <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                    {filteredOverviews.length === 0 &&
                    !fetchingCashierTransactions ? (
                      <div className="flex items-center justify-center h-24 text-[11px] text-content/95">
                        {transactionLoadingMessage || "No transactions found"}
                      </div>
                    ) : (
                      <>
                        <TransactionFilters
                          draftTransId={draftTransId}
                          setDraftTransId={setDraftTransId}
                          draftQty={draftQty}
                          setDraftQty={setDraftQty}
                          draftSales={draftSales}
                          setDraftSales={setDraftSales}
                          appliedTransId={appliedTransId}
                          setAppliedTransId={setAppliedTransId}
                          appliedQty={appliedQty}
                          setAppliedQty={setAppliedQty}
                          appliedSales={appliedSales}
                          setAppliedSales={setAppliedSales}
                          saleDateFilter={saleDateFilter}
                          uniqueDates={uniqueDates}
                        />
                        <TransactionRows
                          fetchingCashierTransactions={fetchingCashierTransactions}
                          transactionLoadingMessage={transactionLoadingMessage}
                          filteredOverviews={filteredOverviews}
                          handleRowClick={handleRowClick}
                        />
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
