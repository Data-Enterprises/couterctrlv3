import { useMemo, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { buildLedgerRows, fmtDate } from "../shared/ledgerUtils";
import {
  setListSevFilter,
  navigateToReport,
  setHasSearched,
  setThreshold,
} from "../../../features/salesLedgerSlice";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import type { LedgerRowData } from "../components/LedgerRow";
import { addDays, formatGoliathDate } from "../../../utils";
import SevChips from "../../../components/SevChips";
import MobilePerfHeader from "../../../components/mobile/MobilePerfHeader";
import { SALES_LEDGER_INFO } from "../salesInfo";
import { useSearchScopeLabel } from "../../../hooks/useSearchScopeLabel";
import StoreRow from "./components/StoreRow";

const LedgerStoreList = () => {
  const dispatch = useAppDispatch();
  const scopeLabel = useSearchScopeLabel();
  const search = useAppSelector((s) => s.search);
  const { weeklySales, weeklySalesLastWeek, weeklySalesLastYear } =
    useAppSelector((s) => s.sales);
  const { listSevFilter, threshold, gradingMetric } = useAppSelector(
    (s) => s.salesLedger,
  );
  const { assignedStores } = useAppSelector((s) => s.user);

  // Grading should never move stores around on its own when the threshold
  // input is cleared — with no new number typed, keep grading against the
  // last valid amount so severity/sort order stays exactly where it was.
  const lastValidThresholdRef = useRef<number>(threshold?.amount ?? 9);
  if (threshold?.amount != null) {
    lastValidThresholdRef.current = threshold.amount;
  }

  const twEnd = formatGoliathDate(search.singleDate);
  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  const weekLabel = `${fmtDate(twStart)} – ${fmtDate(twEnd)}, ${new Date(twEnd + "T12:00:00").getFullYear()}`;

  const ledgerRows = useMemo(
    () =>
      buildLedgerRows(
        weeklySales,
        weeklySalesLastWeek,
        weeklySalesLastYear,
        assignedStores,
        lastValidThresholdRef.current,
        gradingMetric,
      ),
    [
      weeklySales,
      weeklySalesLastWeek,
      weeklySalesLastYear,
      assignedStores,
      threshold,
      gradingMetric,
    ],
  );

  const filtered =
    listSevFilter === "all"
      ? ledgerRows
      : ledgerRows.filter((r) => r.severity === listSevFilter);
  const critRows = filtered.filter((r) => r.severity === "critical");
  const watchRows = filtered.filter((r) => r.severity === "watch");
  const healthyRows = filtered.filter((r) => r.severity === "healthy");

  const counts: Record<SevFilter, number> = {
    all: ledgerRows.length,
    critical: ledgerRows.filter((r) => r.severity === "critical").length,
    watch: ledgerRows.filter((r) => r.severity === "watch").length,
    healthy: ledgerRows.filter((r) => r.severity === "healthy").length,
  };

  const handleSelectStore = (row: LedgerRowData) => {
    const sorted = [...row.days].sort((a, b) =>
      a.sale_date.localeCompare(b.sale_date),
    );
    dispatch(
      navigateToReport({
        storeId: row.storeid,
        storeName: row.store_name,
        storeNumber: row.store_number,
        storeNumbersForId: row.storeNumbersForId,
        start: sorted[0]?.sale_date.split("T")[0] ?? "",
        end: sorted[sorted.length - 1]?.sale_date.split("T")[0] ?? "",
        mode: "weekly",
        days: sorted,
        severity: row.severity,
      }),
    );
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50 overflow-hidden">
      <MobilePerfHeader
        pageName="Weekly Sales"
        dateRange={weekLabel}
        storeName={scopeLabel}
        onSearch={() => dispatch(setHasSearched(false))}
        info={SALES_LEDGER_INFO}
        threshold={
          <ThresholdFilter
            value={threshold}
            onChange={(v) => dispatch(setThreshold(v))}
            suffix="%"
            showOp={false}
            inputWidth={40}
            variant="dark"
          />
        }
      />
      <SevChips
        active={listSevFilter}
        counts={counts}
        onChange={(f) => dispatch(setListSevFilter(f))}
      />
      {/* pb-14 clears the fixed bottom tab bar, which is outside document
          flow and would otherwise hide the last row. 56px, matching its
          height exactly. */}
      <div className="flex-1 overflow-y-auto pb-14">
        {critRows.map((r) => (
          <StoreRow
            key={`${r.storeid}__${r.store_number}`}
            row={r}
            onClick={handleSelectStore}
          />
        ))}
        {watchRows.map((r) => (
          <StoreRow
            key={`${r.storeid}__${r.store_number}`}
            row={r}
            onClick={handleSelectStore}
          />
        ))}
        {healthyRows.map((r) => (
          <StoreRow
            key={`${r.storeid}__${r.store_number}`}
            row={r}
            onClick={handleSelectStore}
          />
        ))}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            No stores match filter
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerStoreList;
