import { useSalesState } from "./hooks/useSalesState";
import { useState, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { getWeekly, getHourly } from "../../api/sales";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import { addDays, formatGoliathDate, sameWeekDayLastYear } from "../../utils";
import type { WeeklySale, Store } from "../../interfaces";
import {
  setWeeklySales,
  setWeeklySalesLastWeek,
  setWeeklySalesLastYear,
  setHourlySales,
  setHourlySalesLastWeek,
  setHourlySalesLastYear,
  concatWeeklySales,
  concatWeeklySalesLastWeek,
  concatWeeklySalesLastYear,
  concatHourlySales,
  concatHourlySalesLastWeek,
  concatHourlySalesLastYear,
  reQuery,
} from "../../features/salesSlice";
import {
  setHasSearched,
  setLedgerLoading,
  setLedgerSelection,
  reQueryLedger,
  type GradingMetric,
} from "../../features/salesLedgerSlice";
import { useToast } from "../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../components/EmptyPrompt";
import TierStrip from "../../components/TierStrip";
import LedgerEntryCard from "./components/LedgerEntryCard";
import StoreDetailPopup from "./components/StoreDetailPopup";
import TierColumn from "./components/TierColumn";
import LedgerHeader from "./components/LedgerHeader";
import { type LedgerRowData } from "./components/LedgerRow";

const SEVERITY_RANK = { critical: 0, watch: 1, healthy: 2 } as const;

const buildLedgerRows = (
  twData: WeeklySale[],
  lwData: WeeklySale[],
  lyData: WeeklySale[],
  assignedStores: Store[],
  threshold: number,
  gradingMetric: GradingMetric,
): LedgerRowData[] => {
  const storeIds = [...new Set(twData.map((d) => d.storeid))];

  return storeIds
    .map((id) => {
      const twRows = twData.filter((d) => d.storeid === id);
      const lwRows = lwData.filter((d) => d.storeid === id);
      const lyRows = lyData.filter((d) => d.storeid === id);
      const ref = twRows[0];
      const assigned = assignedStores.find((s) => s.storeid === id);

      const twTotal = twRows.reduce(
        (acc, r) => acc + (r.total_sales - r.total_tax),
        0,
      );
      const lwTotal = lwRows.reduce(
        (acc, r) => acc + (r.total_sales - r.total_tax),
        0,
      );
      const lyTotal = lyRows.reduce(
        (acc, r) => acc + (r.total_sales - r.total_tax),
        0,
      );
      const twQty = twRows.reduce((acc, r) => acc + r.qty, 0);
      const lwQty = lwRows.reduce((acc, r) => acc + r.qty, 0);
      const lyQty = lyRows.reduce((acc, r) => acc + r.qty, 0);

      const gradeTW = gradingMetric === "qty" ? twQty : twTotal;
      const gradeLW = gradingMetric === "qty" ? lwQty : lwTotal;
      const gradeLY = gradingMetric === "qty" ? lyQty : lyTotal;

      const hasLW = lwTotal > 0;
      const hasLY = lyTotal > 0;
      const vsLYDollar = twTotal - lyTotal;
      const vsLYPct = hasLY ? ((gradeTW - gradeLY) / gradeLY) * 100 : 0;
      const vsLWPct = hasLW ? ((gradeTW - gradeLW) / gradeLW) * 100 : 0;

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
          const lwDate = addDays(new Date(twDate), -7)
            .toISOString()
            .split("T")[0];
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
        twQty,
        lwQty,
        lyQty,
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
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
  const { userid } = useAppSelector((state) => state.user);
  const search = useAppSelector((state) => state.search);
  const {
    weeklySales = [],
    weeklySalesLastWeek = [],
    weeklySalesLastYear = [],
    // hourlySales = [],
    // hourlySalesLastWeek = [],
    // hourlySalesLastYear = [],
  } = useSalesState();
  const {
    hasSearched,
    selection,
    ledgerLoading: loading,
    threshold,
    gradingMetric,
  } = useAppSelector((state) => state.salesLedger);
  const { assignedStores } = useAppSelector((state) => state.user);

  // Grading should never move stores around on its own when the threshold
  // input is cleared — with no new number typed, keep grading against the
  // last valid amount so severity/sort order stays exactly where it was.
  const lastValidThresholdRef = useRef<number>(threshold?.amount ?? 9);
  if (threshold?.amount != null) {
    lastValidThresholdRef.current = threshold.amount;
  }

  const [searchModalOpen, setSearchModalOpen] = useState(false);

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
    const isGroup = search.type === "Group";
    const useGroups = isGroup ? 1 : 0;
    const singleStore = isGroup ? 0 : 1;
    const searchValue = isGroup ? search.lastGroup : search.lastStore;
    if (!searchValue) return;

    const { twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd } = getDateRanges();

    dispatch(setLedgerLoading(true));
    dispatch(setHasSearched(true));
    dispatch(reQuery());
    dispatch(reQueryLedger());
    setSearchModalOpen(false);

    // Large group path: >30 stores → per-store calls, collect progressively
    if (isGroup) {
      try {
        const groupResp = await getStoresAssignedToUserGroup(context.url, context.token, userid, search.lastGroup);
        if (groupResp.data.error !== 0) toast.warn(groupResp.data.msg);
        const stores: Store[] = groupResp.data.error === 0
          ? groupResp.data.stores.filter((s: any) => s.active)
          : [];

        if (stores.length > 30) {
          await Promise.allSettled(
            stores.map((store) =>
              Promise.all([
                getWeekly(context.url, context.token, twStart, twEnd, 0, store.storeid, 1),
                getWeekly(context.url, context.token, lwStart, lwEnd, 0, store.storeid, 1),
                getWeekly(context.url, context.token, lyStart, lyEnd, 0, store.storeid, 1),
                getHourly(context.url, context.token, twStart, twEnd, 0, store.storeid, 1),
                getHourly(context.url, context.token, lwStart, lwEnd, 0, store.storeid, 1),
                getHourly(context.url, context.token, lyStart, lyEnd, 0, store.storeid, 1),
              ]).then(([tw, lw, ly, h, lh, lhy]) => {
                if (tw.data.error === 0)  dispatch(concatWeeklySales(tw.data.sales));
                if (lw.data.error === 0)  dispatch(concatWeeklySalesLastWeek(lw.data.sales));
                if (ly.data.error === 0)  dispatch(concatWeeklySalesLastYear(ly.data.sales));
                if (h.data.error === 0)   dispatch(concatHourlySales(h.data.subs));
                if (lh.data.error === 0)  dispatch(concatHourlySalesLastWeek(lh.data.subs));
                if (lhy.data.error === 0) dispatch(concatHourlySalesLastYear(lhy.data.subs));
              }).catch(() => {})
            )
          );
          dispatch(setLedgerLoading(false));
          return;
        }
      } catch {
        // fall through to standard call
      }
    }

    // Standard path: single store or small group
    try {
      const [twResp, lwResp, lyResp, hourlyResp, lwHourlyResp, lyHourlyResp] =
        await Promise.all([
          getWeekly(context.url, context.token, twStart, twEnd, useGroups, searchValue, singleStore),
          getWeekly(context.url, context.token, lwStart, lwEnd, useGroups, searchValue, singleStore),
          getWeekly(context.url, context.token, lyStart, lyEnd, useGroups, searchValue, singleStore),
          getHourly(context.url, context.token, twStart, twEnd, useGroups, searchValue, singleStore),
          getHourly(context.url, context.token, lwStart, lwEnd, useGroups, searchValue, singleStore),
          getHourly(context.url, context.token, lyStart, lyEnd, useGroups, searchValue, singleStore),
        ]);
      if (twResp.data.error === 0)       dispatch(setWeeklySales(twResp.data.sales));
      else                               toast.warn(twResp.data.msg);
      if (lwResp.data.error === 0)       dispatch(setWeeklySalesLastWeek(lwResp.data.sales));
      if (lyResp.data.error === 0)       dispatch(setWeeklySalesLastYear(lyResp.data.sales));
      if (hourlyResp.data.error === 0)   dispatch(setHourlySales(hourlyResp.data.subs));
      else                               toast.warn(hourlyResp.data.msg);
      if (lwHourlyResp.data.error === 0) dispatch(setHourlySalesLastWeek(lwHourlyResp.data.subs));
      if (lyHourlyResp.data.error === 0) dispatch(setHourlySalesLastYear(lyHourlyResp.data.subs));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      dispatch(setLedgerLoading(false));
    }
  };

  const ledgerRows = buildLedgerRows(
    weeklySales,
    weeklySalesLastWeek,
    weeklySalesLastYear,
    assignedStores,
    lastValidThresholdRef.current,
    gradingMetric,
  );

  const criticalRows = ledgerRows.filter((r) => r.severity === "critical");
  const watchRows = ledgerRows.filter((r) => r.severity === "watch");
  const healthyRows = ledgerRows.filter((r) => r.severity === "healthy");

  const heroTWTotal = ledgerRows.reduce((acc, r) => acc + r.twTotal, 0);
  const heroLYTotal = ledgerRows.reduce((acc, r) => acc + r.lyTotal, 0);
  const heroLWTotal = ledgerRows.reduce((acc, r) => acc + r.lwTotal, 0);
  const heroTWQty = ledgerRows.reduce((acc, r) => acc + r.twQty, 0);
  const heroLYQty = ledgerRows.reduce((acc, r) => acc + r.lyQty, 0);
  const heroLWQty = ledgerRows.reduce((acc, r) => acc + r.lwQty, 0);
  const heroGradeTW = gradingMetric === "qty" ? heroTWQty : heroTWTotal;
  const heroGradeLY = gradingMetric === "qty" ? heroLYQty : heroLYTotal;
  const heroGradeLW = gradingMetric === "qty" ? heroLWQty : heroLWTotal;
  const heroVsLYPct = heroGradeLY
    ? ((heroGradeTW - heroGradeLY) / heroGradeLY) * 100
    : 0;
  const heroVsLWPct = heroGradeLW
    ? ((heroGradeTW - heroGradeLW) / heroGradeLW) * 100
    : 0;

  const weekLabel = (() => {
    const { twStart, twEnd } = getDateRanges();
    const start = new Date(twStart + "T12:00:00");
    const end = new Date(twEnd + "T12:00:00");
    const fmtD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${fmtD(start)} – ${fmtD(end)}/${end.getFullYear()}`;
  })();

  if (!hasSearched) {
    return (
      <div className="w-full min-h-[calc(100vh-3rem)] overflow-hidden p-4">
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
          <div
            className="flex flex-col min-w-0 shadow-lg"
            style={{ flexBasis: "46%", flexShrink: 0 }}
          >
            <LedgerHeader
              weekLabel={weekLabel}
              twTotal={heroTWTotal}
              twQty={heroTWQty}
              vsLYPct={heroVsLYPct}
              vsLWPct={heroVsLWPct}
              hasLY={heroGradeLY > 0}
              hasLW={heroGradeLW > 0}
              onNewSearch={resetToEntry}
              onOpenSearch={() => setSearchModalOpen(true)}
              gradingMetric={gradingMetric}
            />

            {/* Tier summary strip */}
            <TierStrip
              critical={criticalRows.length}
              watch={watchRows.length}
              healthy={healthyRows.length}
              className="border-x border-gray-100"
            />

            {/* Three columns — flex-1 so they fill remaining height */}
            <div className="flex-1 overflow-hidden bg-custom-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
              <TierColumn
                severity="critical"
                rows={criticalRows}
                onSelect={(s) => dispatch(setLedgerSelection(s))}
                selectedStoreId={selection?.storeId}
                gradingMetric={gradingMetric}
              />
              <TierColumn
                severity="watch"
                rows={watchRows}
                onSelect={(s) => dispatch(setLedgerSelection(s))}
                selectedStoreId={selection?.storeId}
                gradingMetric={gradingMetric}
              />
              <TierColumn
                severity="healthy"
                rows={healthyRows}
                onSelect={(s) => dispatch(setLedgerSelection(s))}
                selectedStoreId={selection?.storeId}
                gradingMetric={gradingMetric}
              />
            </div>
          </div>

          {/* Right: report panel */}
          <div
            className="flex-1 min-w-0 shadow-lg"
            style={{ flexBasis: "52%" }}
          >
            {selection !== null ? (
              <StoreDetailPopup
                selection={selection}
                onClose={() => dispatch(setLedgerSelection(null))}
              />
            ) : (
              <EmptyPrompt
                title="No store selected"
                description="Select a store from the list to view its weekly report"
              />
            )}
          </div>
        </div>
      )}

      {/* Search modal */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <LedgerEntryCard onSearch={fetchLedger} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesLedger;
