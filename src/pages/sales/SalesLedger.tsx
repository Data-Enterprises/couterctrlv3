import { useAppSelector, useAppDispatch } from "../../hooks";
import { getWeekly, getHourly } from "../../api/sales";
import { addDays, formatGoliathDate, sameWeekDayLastYear, formatCurrency2 } from "../../utils";
import type { WeeklySale, Store } from "../../interfaces";
import {
  setWeeklySales,
  setWeeklySalesLastWeek,
  setWeeklySalesLastYear,
  setHourlySales,
  setHourlySalesLastWeek,
  setHourlySalesLastYear,
  reQuery,
} from "../../features/salesSlice";
import {
  setHasSearched,
  setLedgerLoading,
  setLedgerSelection,
  setThreshold,
} from "../../features/salesLedgerSlice";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import LedgerEntryCard from "./components/LedgerEntryCard";
import StoreDetailPopup from "./components/StoreDetailPopup";
import TierColumn from "./components/TierColumn";
import { SEVERITY_CONFIG, formatPct } from "./components/tierColumnUtils";
import { type LedgerRowData } from "./components/LedgerRow";

const SEVERITY_RANK = { critical: 0, watch: 1, healthy: 2 } as const;

const buildLedgerRows = (
  twData: WeeklySale[],
  lwData: WeeklySale[],
  lyData: WeeklySale[],
  assignedStores: Store[],
  threshold: number,
): LedgerRowData[] => {
  const storeIds = [...new Set(twData.map((d) => d.storeid))];

  return storeIds
    .map((id) => {
      const twRows = twData.filter((d) => d.storeid === id);
      const lwRows = lwData.filter((d) => d.storeid === id);
      const lyRows = lyData.filter((d) => d.storeid === id);
      const ref = twRows[0];
      const assigned = assignedStores.find((s) => s.storeid === id);

      const twTotal = twRows.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
      const lwTotal = lwRows.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
      const lyTotal = lyRows.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
      const hasLW = lwTotal > 0;
      const hasLY = lyTotal > 0;
      const vsLYDollar = twTotal - lyTotal;
      const vsLYPct = hasLY ? (vsLYDollar / lyTotal) * 100 : 0;
      const vsLWPct = hasLW ? ((twTotal - lwTotal) / lwTotal) * 100 : 0;

      const severity: LedgerRowData["severity"] = (() => {
        const pct = hasLY ? vsLYPct : hasLW ? vsLWPct : 0;
        if (pct < -threshold) return "critical";
        if (pct < 0) return "watch";
        return "healthy";
      })();

      const days = twRows
        .sort((a, b) => a.sale_date.localeCompare(b.sale_date))
        .map((r) => {
          const twDate = r.sale_date.split("T")[0];
          const lwDate = addDays(new Date(twDate), -7).toISOString().split("T")[0];
          const lyDate = sameWeekDayLastYear(twDate).date;
          const lwRow = lwRows.find((l) => l.sale_date.startsWith(lwDate));
          const lyRow = lyRows.find((l) => l.sale_date.startsWith(lyDate));
          return {
            sale_date: r.sale_date,
            twNet: r.total_sales - r.total_tax,
            lwNet: lwRow ? lwRow.total_sales - lwRow.total_tax : 0,
            lyNet: lyRow ? lyRow.total_sales - lyRow.total_tax : 0,
          };
        });

      return {
        storeid: id,
        store_name: assigned?.store_name ?? ref.store_name,
        store_number: assigned?.store_number ?? ref.store_number,
        twTotal,
        lwTotal,
        lyTotal,
        vsLWPct,
        vsLYPct,
        vsLYDollar,
        hasLW,
        hasLY,
        severity,
        days,
      };
    })
    .sort((a, b) => {
      const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (rankDiff !== 0) return rankDiff;
      const aPct = a.hasLY ? a.vsLYPct : a.vsLWPct;
      const bPct = b.hasLY ? b.vsLYPct : b.vsLWPct;
      return aPct - bPct;
    });
};

const SalesLedger = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const {
    weeklySales = [],
    weeklySalesLastWeek = [],
    weeklySalesLastYear = [],
    // hourlySales = [],
    // hourlySalesLastWeek = [],
    // hourlySalesLastYear = [],
  } = useAppSelector((state) => state.sales);
  const { hasSearched, selection, ledgerLoading: loading, threshold } = useAppSelector((state) => state.salesLedger);
  const { assignedStores } = useAppSelector((state) => state.user);

  const resetToEntry = () => {
    dispatch(reQuery());
    dispatch(setHasSearched(false));
    dispatch(setLedgerSelection(null));
  };

  const getDateRanges = () => {
    const twEnd = formatGoliathDate(search.singleDate);
    const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
    const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
    const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
    const lyEnd = sameWeekDayLastYear(twEnd).date;
    const lyStart = sameWeekDayLastYear(twStart).date;
    return { twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd };
  };

  const fetchLedger = async () => {
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;
    if (!searchValue) return;

    const { twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd } = getDateRanges();

    dispatch(setLedgerLoading(true));
    dispatch(setHasSearched(true));
    dispatch(reQuery());
    try {
      const [twResp, lwResp, lyResp, hourlyResp, lwHourlyResp, lyHourlyResp] = await Promise.all([
        getWeekly(context.url, context.token, twStart, twEnd, useGroups, searchValue, singleStore),
        getWeekly(context.url, context.token, lwStart, lwEnd, useGroups, searchValue, singleStore),
        getWeekly(context.url, context.token, lyStart, lyEnd, useGroups, searchValue, singleStore),
        getHourly(context.url, context.token, twStart, twEnd, useGroups, searchValue, singleStore),
        getHourly(context.url, context.token, lwStart, lwEnd, useGroups, searchValue, singleStore),
        getHourly(context.url, context.token, lyStart, lyEnd, useGroups, searchValue, singleStore),
      ]);
      if (twResp.data.error === 0) dispatch(setWeeklySales(twResp.data.sales));
      if (lwResp.data.error === 0) dispatch(setWeeklySalesLastWeek(lwResp.data.sales));
      if (lyResp.data.error === 0) dispatch(setWeeklySalesLastYear(lyResp.data.sales));
      if (hourlyResp.data.error === 0) dispatch(setHourlySales(hourlyResp.data.subs));
      if (lwHourlyResp.data.error === 0) dispatch(setHourlySalesLastWeek(lwHourlyResp.data.subs));
      if (lyHourlyResp.data.error === 0) dispatch(setHourlySalesLastYear(lyHourlyResp.data.subs));
    } finally {
      dispatch(setLedgerLoading(false));
    }
  };

  const ledgerRows = buildLedgerRows(weeklySales, weeklySalesLastWeek, weeklySalesLastYear, assignedStores, threshold);

  const criticalRows = ledgerRows.filter((r) => r.severity === "critical");
  const watchRows = ledgerRows.filter((r) => r.severity === "watch");
  const healthyRows = ledgerRows.filter((r) => r.severity === "healthy");

  const heroTWTotal = ledgerRows.reduce((acc, r) => acc + r.twTotal, 0);
  const heroLYTotal = ledgerRows.reduce((acc, r) => acc + r.lyTotal, 0);
  const heroVsLYPct = heroLYTotal ? ((heroTWTotal - heroLYTotal) / heroLYTotal) * 100 : 0;

  const weekLabel = (() => {
    const { twStart, twEnd } = getDateRanges();
    const start = new Date(twStart + "T12:00:00");
    const end = new Date(twEnd + "T12:00:00");
    const fmt = (d: Date) =>
      `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
    return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
  })();

  if (!hasSearched) {
    return (
      <div className="w-full min-h-[calc(100vh-3rem)] p-4">
        <LedgerEntryCard onSearch={fetchLedger} loading={loading} />
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {loading ? (
        <div className="relative h-[calc(100vh-3rem)]">
          <LoadingIndicator message="Loading store ledger" />
        </div>
      ) : ledgerRows.length === 0 ? (
        <div className="h-[calc(100vh-3rem)] flex items-center justify-center text-content/40 text-sm">
          No data found for this period.
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-5rem)]">
          {/* Left: store list */}
          <div className="flex-1 flex flex-col min-w-0 shadow-lg">
            {/* Navy header */}
            <div className="bg-[#1e2a4a] rounded-t-xl px-4 py-3 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetToEntry}
                    className="text-white font-semibold text-[13px] hover:text-white/80 transition-colors text-left"
                  >
                    Weekly Performance
                  </button>
                  {/* <button onClick={resetToEntry} className="flex items-center gap-1 mb-0.5">
                    <i className="ti ti-refresh" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} aria-hidden="true" />
                    <span className="text-[10px] text-white/50">New search</span>
                  </button> */}
                </div>
                <div className="text-white/40 text-[10px] mt-0.5">{weekLabel}</div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                <div className="text-white/50 text-[9px]">Graded against LY, LW fallback</div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1"><div className="w-[7px] h-[7px] rounded-[2px] bg-red-200 flex-shrink-0" /><span className="text-white/60 text-[9px]">Critical &gt;9%</span></div>
                  <div className="flex items-center gap-1"><div className="w-[7px] h-[7px] rounded-[2px] bg-amber-200 flex-shrink-0" /><span className="text-white/60 text-[9px]">Watch ≤9%</span></div>
                  <div className="flex items-center gap-1"><div className="w-[7px] h-[7px] rounded-[2px] bg-emerald-200 flex-shrink-0" /><span className="text-white/60 text-[9px]">Healthy</span></div>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="text-right">
                  <div className="text-white/40 text-[8px] uppercase tracking-wide font-medium">
                    Total Net
                  </div>
                  <div className="text-white font-semibold text-[13px]">
                    {formatCurrency2(heroTWTotal)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-[8px] uppercase tracking-wide font-medium">
                    vs LY
                  </div>
                  <div
                    className={`font-semibold text-[13px] ${
                      heroVsLYPct >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {formatPct(heroVsLYPct)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-[8px] uppercase tracking-wide font-medium mb-1">Threshold</div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={threshold}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v >= 1 && v <= 99) dispatch(setThreshold(v));
                      }}
                      className="w-12 text-center text-[12px] font-semibold bg-white/10 text-white rounded px-1.5 py-0.5 border border-white/20 focus:outline-none focus:border-white/50"
                    />
                    <span className="text-white/50 text-[11px]">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier summary strip */}
            <div className="border-x border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
              {(["critical", "watch", "healthy"] as const).map((sev) => {
                const cfg = SEVERITY_CONFIG[sev];
                const count =
                  sev === "critical"
                    ? criticalRows.length
                    : sev === "watch"
                    ? watchRows.length
                    : healthyRows.length;
                return (
                  <div key={sev} className={`flex items-center justify-between gap-4 px-6 py-3 ${cfg.headerBg}`}>
                    <cfg.Icon className="w-6 h-6 flex-shrink-0" style={{ color: cfg.iconColor }} />
                    <span className="text-[15px] font-medium text-content/60">{cfg.label}</span>
                    <span className="text-[15px] font-semibold text-content leading-none">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Three columns — flex-1 so they fill remaining height */}
            <div className="flex-1 overflow-hidden bg-custom-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
              <TierColumn severity="critical" rows={criticalRows} onSelect={(s) => dispatch(setLedgerSelection(s))} selectedStoreId={selection?.storeId} />
              <TierColumn severity="watch" rows={watchRows} onSelect={(s) => dispatch(setLedgerSelection(s))} selectedStoreId={selection?.storeId} />
              <TierColumn severity="healthy" rows={healthyRows} onSelect={(s) => dispatch(setLedgerSelection(s))} selectedStoreId={selection?.storeId} />
            </div>
          </div>

          {/* Right: report panel */}
          <div className="flex-1 min-w-0 shadow-lg">
            {selection !== null ? (
              <StoreDetailPopup selection={selection} onClose={() => dispatch(setLedgerSelection(null))} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 bg-custom-white/60 rounded-xl border border-dashed border-gray-200">
                <div className="text-content/20 text-[13px] font-medium">No store selected</div>
                <div className="text-content/15 text-[11px]">
                  Select a store from the list to view its weekly report
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesLedger;
