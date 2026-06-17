import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { getWeekly, getHourly } from "../../api/sales";
import { addDays, formatGoliathDate, sameWeekDayLastYear } from "../../utils";
import type { WeeklySale } from "../../interfaces";
import {
  setWeeklySales,
  setWeeklySalesLastWeek,
  setWeeklySalesLastYear,
  setHourlySales,
  setHourlySalesLastWeek,
  setHourlySalesLastYear,
  reQuery,
} from "../../features/salesSlice";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import LedgerEntryCard from "./components/LedgerEntryCard";
import LedgerHeroBar from "./components/LedgerHeroBar";
import LedgerFilterChips, { type FilterMode } from "./components/LedgerFilterChips";
import LedgerRow, { type LedgerRowData, type StoreSelection } from "./components/LedgerRow";
import StoreDetailPopup from "./components/StoreDetailPopup";

const buildLedgerRows = (
  twData: WeeklySale[],
  lwData: WeeklySale[],
  lyData: WeeklySale[],
): LedgerRowData[] => {
  const storeIds = [...new Set(twData.map((d) => d.storeid))];

  return storeIds
    .map((id) => {
      const twRows = twData.filter((d) => d.storeid === id);
      const lwRows = lwData.filter((d) => d.storeid === id);
      const lyRows = lyData.filter((d) => d.storeid === id);
      const ref = twRows[0];

      const twTotal = twRows.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
      const lwTotal = lwRows.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
      const lyTotal = lyRows.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
      const vsLYDollar = twTotal - lyTotal;
      const vsLYPct = lyTotal ? (vsLYDollar / lyTotal) * 100 : 0;

      const days = twRows
        .sort((a, b) => a.sale_date.localeCompare(b.sale_date))
        .map((r) => {
          const lyDate = sameWeekDayLastYear(r.sale_date.split("T")[0]).date;
          const lyRow = lyRows.find((l) => l.sale_date.startsWith(lyDate));
          return {
            sale_date: r.sale_date,
            twNet: r.total_sales - r.total_tax,
            lyNet: lyRow ? lyRow.total_sales - lyRow.total_tax : 0,
          };
        });

      return {
        storeid: id,
        store_name: ref.store_name,
        store_number: ref.store_number,
        twTotal,
        lwTotal,
        lyTotal,
        vsLYPct,
        vsLYDollar,
        days,
      };
    })
    .sort((a, b) => b.vsLYPct - a.vsLYPct);
};

const SalesLedger = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const {
    weeklySales = [],
    weeklySalesLastWeek = [],
    weeklySalesLastYear = [],
    hourlySales = [],
    hourlySalesLastWeek = [],
    hourlySalesLastYear = [],
  } = useAppSelector((state) => state.sales);

  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [selection, setSelection] = useState<StoreSelection | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const resetToEntry = () => {
    dispatch(reQuery());
    setHasSearched(false);
    setSelection(null);
    setFilter("all");
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

    setLoading(true);
    setHasSearched(true);
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
      setLoading(false);
    }
  };

  const ledgerRows = buildLedgerRows(weeklySales, weeklySalesLastWeek, weeklySalesLastYear);

  const filtered = ledgerRows.filter((r) => {
    if (filter === "attention") return r.vsLYPct < 0;
    if (filter === "above") return r.vsLYPct >= 0;
    return true;
  });

  const heroTWTotal = ledgerRows.reduce((acc, r) => acc + r.twTotal, 0);
  const heroLYTotal = ledgerRows.reduce((acc, r) => acc + r.lyTotal, 0);
  const heroVsLYPct = heroLYTotal ? ((heroTWTotal - heroLYTotal) / heroLYTotal) * 100 : 0;
  const attentionCount = ledgerRows.filter((r) => r.vsLYPct < 0).length;

  const totalTransactions = hourlySales.reduce((acc, r) => acc + r.transactions, 0);
  const totalNetSales = hourlySales.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
  const avgBasket = totalTransactions > 0 ? totalNetSales / totalTransactions : 0;

  const lwTransactions = hourlySalesLastWeek.reduce((acc, r) => acc + r.transactions, 0);
  const lwNetSales = hourlySalesLastWeek.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
  const lwAvgBasket = lwTransactions > 0 ? lwNetSales / lwTransactions : 0;

  const lyTransactions = hourlySalesLastYear.reduce((acc, r) => acc + r.transactions, 0);
  const lyNetSales = hourlySalesLastYear.reduce((acc, r) => acc + (r.total_sales - r.total_tax), 0);
  const lyAvgBasket = lyTransactions > 0 ? lyNetSales / lyTransactions : 0;

  const weekLabel = (() => {
    const { twStart, twEnd } = getDateRanges();
    const start = new Date(twStart + "T12:00:00");
    const end = new Date(twEnd + "T12:00:00");
    const fmt = (d: Date) =>
      `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
    return `Week of ${fmt(start)}–${fmt(end)}, ${end.getFullYear()}`;
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
        <div className="w-1/2 mx-auto">
          <LedgerHeroBar
            weekLabel={weekLabel}
            twTotal={heroTWTotal}
            vsLYPct={heroVsLYPct}
            attentionCount={attentionCount}
            totalTransactions={totalTransactions}
            lwTransactions={lwTransactions}
            lyTransactions={lyTransactions}
            avgBasket={avgBasket}
            lwAvgBasket={lwAvgBasket}
            lyAvgBasket={lyAvgBasket}
            onReset={resetToEntry}
          />

          <LedgerFilterChips
            filter={filter}
            totalCount={ledgerRows.length}
            attentionCount={attentionCount}
            onChange={setFilter}
          />

          <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-10" />
                <col className="w-[15rem]" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-12" />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 text-content/40 text-[11px] uppercase tracking-wide">
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Store</th>
                  <th className="text-right px-4 py-2">TW Sales</th>
                  <th className="text-right px-4 py-2">LW Sales</th>
                  <th className="text-right px-4 py-2">LY Sales</th>
                  <th className="text-center px-4 py-2">Status</th>
                </tr>
              </thead>
            </table>
            <div className="overflow-y-auto thin-scrollbar max-h-[calc(100vh-20rem)]">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-10" />
                  <col className="w-[15rem]" />
                  <col className="w-28" />
                  <col className="w-28" />
                  <col className="w-28" />
                  <col className="w-12" />
                </colgroup>
                <tbody>
                  {filtered.map((row, i) => (
                    <LedgerRow
                      key={row.storeid}
                      row={row}
                      rank={i + 1}
                      onClick={setSelection}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selection !== null && (
        <StoreDetailPopup
          selection={selection}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
};

export default SalesLedger;
