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
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import SevChips from "./components/SevChips";
import StoreRow from "./components/StoreRow";

const LedgerStoreList = () => {
  const dispatch = useAppDispatch();
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
      <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-custom-white font-semibold text-[15px]">
              Weekly performance
            </div>
            <div className="text-custom-white/85 text-[11px] mt-0.5">
              {weekLabel}
            </div>
          </div>
          <button
            onClick={() => dispatch(setHasSearched(false))}
            aria-label="New search"
            className="flex-shrink-0 w-[28px] h-[28px] flex items-center justify-center rounded-md border border-white/25 text-custom-white/85 hover:text-custom-white hover:border-white/45 transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 mt-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-red-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[10px]">
                {threshold ? `Critical >${threshold.amount}%` : "Critical"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-amber-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[10px]">
                {threshold ? `Watch ≤${threshold.amount}%` : "Watch"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-emerald-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[10px]">Healthy</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-custom-white/85">Threshold</span>
            <ThresholdFilter
              value={threshold}
              onChange={(v) => dispatch(setThreshold(v))}
              suffix="%"
              showOp={false}
              inputWidth={40}
              variant="dark"
            />
          </div>
        </div>
      </div>
      <SevChips
        active={listSevFilter}
        counts={counts}
        onChange={(f) => dispatch(setListSevFilter(f))}
      />
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        {critRows.map((r) => (
          <StoreRow key={r.storeid} row={r} onClick={handleSelectStore} />
        ))}
        {watchRows.map((r) => (
          <StoreRow key={r.storeid} row={r} onClick={handleSelectStore} />
        ))}
        {healthyRows.map((r) => (
          <StoreRow key={r.storeid} row={r} onClick={handleSelectStore} />
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
