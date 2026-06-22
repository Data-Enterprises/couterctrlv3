import { useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { buildLedgerRows, fmtDate, formatPct } from "../shared/ledgerUtils";
import { setListSevFilter, navigateToReport, setHasSearched } from "../../../features/salesLedgerSlice";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import type { LedgerRowData } from "../components/LedgerRow";
import type { Severity } from "../components/LedgerRow";
import { addDays, formatGoliathDate, sameWeekDayLastYear } from "../../../utils";
import SevChips from "./components/SevChips";
import StoreRow from "./components/StoreRow";

const LedgerStoreList = () => {
  const dispatch = useAppDispatch();
  const search = useAppSelector((s) => s.search);
  const { weeklySales, weeklySalesLastWeek, weeklySalesLastYear } = useAppSelector((s) => s.sales);
  const { listSevFilter, threshold } = useAppSelector((s) => s.salesLedger);
  const { assignedStores } = useAppSelector((s) => s.user);

  const twEnd = formatGoliathDate(search.singleDate);
  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  const weekLabel = `${fmtDate(twStart)} – ${fmtDate(twEnd)}, ${new Date(twEnd + "T12:00:00").getFullYear()}`;

  const ledgerRows = useMemo(
    () => buildLedgerRows(weeklySales, weeklySalesLastWeek, weeklySalesLastYear, assignedStores, threshold),
    [weeklySales, weeklySalesLastWeek, weeklySalesLastYear, assignedStores, threshold],
  );

  const filtered = listSevFilter === "all" ? ledgerRows : ledgerRows.filter((r) => r.severity === listSevFilter);
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
    const sorted = [...row.days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));
    dispatch(navigateToReport({
      storeId: row.storeid,
      storeName: row.store_name,
      storeNumber: row.store_number,
      start: sorted[0]?.sale_date.split("T")[0] ?? "",
      end: sorted[sorted.length - 1]?.sale_date.split("T")[0] ?? "",
      mode: "weekly",
      days: sorted,
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50 overflow-hidden">
      <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-semibold text-[15px]">Weekly performance</div>
            <div className="text-white/65 text-[11px] mt-0.5">{weekLabel}</div>
          </div>
          <button onClick={() => dispatch(setHasSearched(false))} className="flex items-center gap-1 mt-0.5 flex-shrink-0">
            <i className="ti ti-refresh" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} aria-hidden="true" />
            <span className="text-[10px] text-white/50">New search</span>
          </button>
        </div>
        <div className="flex items-end justify-between gap-3 mt-1">
          <div />
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="text-white/45 text-[9px]">Graded against LY, LW fallback</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1"><div className="w-[7px] h-[7px] rounded-[2px] bg-red-200 flex-shrink-0" /><span className="text-white/60 text-[9px]">Critical &gt;9%</span></div>
              <div className="flex items-center gap-1"><div className="w-[7px] h-[7px] rounded-[2px] bg-amber-200 flex-shrink-0" /><span className="text-white/60 text-[9px]">Watch ≤9%</span></div>
              <div className="flex items-center gap-1"><div className="w-[7px] h-[7px] rounded-[2px] bg-emerald-200 flex-shrink-0" /><span className="text-white/60 text-[9px]">Healthy</span></div>
            </div>
          </div>
        </div>
      </div>
      <SevChips active={listSevFilter} counts={counts} onChange={(f) => dispatch(setListSevFilter(f))} />
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
        {critRows.map((r) => <StoreRow key={r.storeid} row={r} onClick={handleSelectStore} />)}
        {watchRows.map((r) => <StoreRow key={r.storeid} row={r} onClick={handleSelectStore} />)}
        {healthyRows.map((r) => <StoreRow key={r.storeid} row={r} onClick={handleSelectStore} />)}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/55">
            No stores match filter
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerStoreList;
