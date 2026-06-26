import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useApiContext } from "../../hooks";
import { getCashierDetails, getCashierTable, getTransactionList } from "../../../api/lossPrevention";
import {
  reQuery,
  setCashierDetails,
  setCashiers,
  setCashierTrends,
  setFetchingCashierTransactions,
  setLoadingCashierDetails,
  setSelectedSaleIds,
  setSelectedSaleType,
  setSelectedStoreId,
  setTransactionLoadingMessage,
  setTransList,
  setTransOverviews,
  toggleNoTransMsg,
} from "../../../features/lossPreventionSlice";
import type { JsonError, TransactionListItem, TransactionOverview, UniqueCashier } from "../../../interfaces";
import { formatCurrency2, formatGoliathDate } from "../../../utils";
import SevChips from "../../sales/mobile/components/SevChips";
import SevBadge from "../../sales/mobile/components/SevBadge";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import type { CashierDetails, CashierTrend } from "../../../interfaces";
import SelectFilter from "../../../components/filters/SelectFilter";

interface Props {
  onOpenSearch: () => void;
  onStoreSelected: () => void;
}

const isNoSale = (saleType: string) =>
  saleType.toLowerCase().replace(/[^a-z]/g, "") === "nosale";

const getStoreSev = (
  detail: CashierDetails,
  trend: CashierTrend | undefined,
  saleType: string,
): "critical" | "watch" | "healthy" => {
  if (!trend) return "critical";
  if (isNoSale(saleType)) {
    const score = [
      detail.transaction_count <= trend.transaction_count,
      detail.total_items <= trend.total_items,
    ].filter(Boolean).length;
    if (score === 2) return "healthy";
    if (score === 1) return "watch";
    return "critical";
  }
  const score = [
    detail.transaction_count <= trend.transaction_count,
    detail.total_items <= trend.total_items,
    Math.abs(detail.amount) <= Math.abs(trend.amount),
    Math.abs(detail.average_dollars) <= Math.abs(trend.average_dollars),
  ].filter(Boolean).length;
  if (score >= 3) return "healthy";
  if (score === 2) return "watch";
  return "critical";
};

const MetricChip = ({
  label, value, isPass,
}: { label: string; value: string; isPass: boolean | null }) => (
  <div
    className={`flex items-baseline gap-1 rounded px-1.5 py-0.5 ${
      isPass === null
        ? "bg-gray-200 text-gray-500"
        : isPass
        ? "bg-emerald-400 text-white"
        : "bg-red-400 text-white"
    }`}
  >
    <span className="text-[9px] opacity-80">{label}</span>
    <span className="text-[10px] font-semibold">{value}</span>
  </div>
);

const StoreListMobile = ({ onOpenSearch, onStoreSelected }: Props) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const params = useApiContext();
  const lp = useAppSelector((state) => state.lossPrevention);
  const search = useAppSelector((state) => state.search);
  const assignedStores = useAppSelector((state) => state.user.assignedStores);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

  const fetchDetails = (saleType: string) => {
    dispatch(reQuery());
    dispatch(setSelectedSaleType(saleType));
    dispatch(setLoadingCashierDetails(true));
    getCashierDetails(params.url, params.token, params.start, params.end, params.useGroups, params.searchValue, params.singleStore, [saleType])
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(toggleNoTransMsg(j.sales.length === 0));
          dispatch(setCashierDetails(j.sales));
          dispatch(setCashierTrends(j.trend));
        }
      })
      .catch((err: JsonError) => toast.error("Error fetching store details: " + err.message))
      .finally(() => dispatch(setLoadingCashierDetails(false)));
  };

  useEffect(() => {
    if (lp.saleTypes.length > 0 && !lp.selectedSaleType && lp.cashierDetails.length === 0) {
      fetchDetails(lp.saleTypes[0].sale_type);
    }
  }, [lp.saleTypes]);

  const handleExceptionChange = (saleType: string) => {
    fetchDetails(saleType);
  };

  const handleStoreClick = (storeid: number) => {
    if (lp.fetchingCashierTransactions) return;
    dispatch(reQuery());
    dispatch(setSelectedStoreId(storeid));
    dispatch(setTransactionLoadingMessage("Loading cashiers…"));
    dispatch(setFetchingCashierTransactions(true));
    dispatch(setTransList([]));

    const saleType = lp.selectedSaleType;
    const start = formatGoliathDate(search.startDate);
    const end   = formatGoliathDate(search.endDate);

    getCashierTable(params.url, params.token, start, end, 0, storeid, 1, [saleType], 1, lp.searchString)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions = [...j.transactions];
          const allTrans = transactions.filter((item: any) => item.sale_type === saleType);

          const doFetch = (saleIds: string[]) => {
            dispatch(setSelectedSaleIds(saleIds));
            fetchTransactions(saleIds, saleType);
          };

          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) pages.push({ page, fetched: false });
            for (let page = 2; page <= j.total_pages; page++) {
              getCashierTable(params.url, params.token, start, end, 0, storeid, 1, [saleType], page, lp.searchString)
                .then((r2) => {
                  if (r2.data.error === 0) {
                    allTrans.push(...r2.data.transactions.filter((t: any) => t.sale_type === saleType));
                    pages.find((p) => p.page === page)!.fetched = true;
                    if (pages.every((p) => p.fetched)) doFetch(Array.from(new Set(allTrans.map((t: any) => t.sale_id))));
                  }
                });
            }
          } else {
            doFetch(Array.from(new Set(transactions.map((item: any) => item.sale_id))));
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const fetchTransactions = (saleIds: string[], saleType: string) => {
    dispatch(setTransactionLoadingMessage("Loading transactions…"));
    getTransactionList(params.url, params.token, saleIds, 1, saleType, lp.searchString)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const newTrans = [...j.transactions];
          const uniqueCashiers = newTrans.reduce((acc: UniqueCashier[], curr) => {
            const found = acc.find((item) => item.cashier_number === curr.cashier_number);
            if (!found) {
              acc.push({ cashier_name: curr.cashier_name, cashier_number: curr.cashier_number, total_sales: curr.total_sales, transaction_count: 1, store_number: curr.store_number, transaction_ids: [curr.sale_id] });
            } else {
              if (!found.transaction_ids.includes(curr.sale_id)) { found.transaction_ids.push(curr.sale_id); found.transaction_count += 1; }
              found.total_sales += curr.total_sales;
            }
            return acc;
          }, []);
          dispatch(setCashiers(uniqueCashiers));

          const formatted: TransactionListItem[] = newTrans.map((item) => ({ ...item, transaction_id: item.sale_id.split("-")[1], sale_date: item.sale_date.split("T")[0], qty: item.qty ?? 0 }));
          const overviews: TransactionOverview[] = formatted.reduce((acc: TransactionOverview[], curr) => {
            const found = acc.find((item) => item.transaction_id === curr.transaction_id);
            if (!found) {
              acc.push({ transaction_id: curr.transaction_id, sale_date: curr.sale_date, sale_type: curr.sale_type, store_number: curr.store_number, cashier_name: curr.cashier_name, cashier_number: curr.cashier_number, qty: curr.qty ?? 0, total_sales: curr.total_sales, sale_id: curr.sale_id, storeid: curr.storeid });
            } else {
              found.qty += curr.qty ?? 0;
              found.total_sales += curr.total_sales;
            }
            return acc;
          }, []);

          dispatch(setTransOverviews(overviews));
          dispatch(setTransList(formatted));
          onStoreSelected();
        }
      })
      .catch((err: JsonError) => toast.error("Error fetching transactions: " + err.message))
      .finally(() => { dispatch(setFetchingCashierTransactions(false)); dispatch(setTransactionLoadingMessage("")); });
  };

  const storesWithSev = useMemo(() => {
    return lp.cashierDetails.map((d) => {
      const trend = lp.cashierTrends.find((t) => t.storeid === d.storeid);
      const sev = getStoreSev(d, trend, lp.selectedSaleType);
      return { ...d, sev, trend };
    });
  }, [lp.cashierDetails, lp.cashierTrends, lp.selectedSaleType]);

  const sevCounts = useMemo(() => ({
    all:      storesWithSev.length,
    critical: storesWithSev.filter((s) => s.sev === "critical").length,
    watch:    storesWithSev.filter((s) => s.sev === "watch").length,
    healthy:  storesWithSev.filter((s) => s.sev === "healthy").length,
  }), [storesWithSev]);

  const visible = useMemo(() => {
    if (sevFilter === "all") return storesWithSev;
    return storesWithSev.filter((s) => s.sev === sevFilter);
  }, [storesWithSev, sevFilter]);

  const noSale = isNoSale(lp.selectedSaleType);
  const fmtMDY = (mdy: string) => new Date(mdy).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekLabel = `${fmtMDY(search.startDate)} – ${fmtMDY(search.endDate)}, ${search.endDate.split("/")[2]}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-semibold text-[15px]">Loss prevention</div>
            <div className="text-white/65 text-[11px] mt-0.5">{weekLabel}</div>
          </div>
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="flex-shrink-0 w-[28px] h-[28px] flex items-center justify-center rounded-md border border-white/25 text-white/65 hover:text-white hover:border-white/45 transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1"><div className="w-[7px] h-[7px] rounded-[2px] bg-red-200 flex-shrink-0" /><span className="text-white/60 text-[9px]">{noSale ? "Critical 0/2" : "Critical ≤1/4"}</span></div>
          <div className="flex items-center gap-1"><div className="w-[7px] h-[7px] rounded-[2px] bg-amber-200 flex-shrink-0" /><span className="text-white/60 text-[9px]">{noSale ? "Watch 1/2" : "Watch 2/4"}</span></div>
          <div className="flex items-center gap-1"><div className="w-[7px] h-[7px] rounded-[2px] bg-emerald-200 flex-shrink-0" /><span className="text-white/60 text-[9px]">{noSale ? "Healthy 2/2" : "Healthy ≥3/4"}</span></div>
        </div>
      </div>

      {/* Exception type selector */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 bg-white">
        <SelectFilter
          options={lp.saleTypes.filter((st) => st.sale_type !== "Description").map((st) => ({ value: st.sale_type, label: st.sale_type }))}
          value={lp.selectedSaleType}
          onChange={handleExceptionChange}
          placeholder=""
          className="w-full"
        />
      </div>

      {/* Sev filter chips */}
      <SevChips active={sevFilter} counts={sevCounts} onChange={setSevFilter} />

      {/* Store list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {lp.loadingCashierDetails && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">Loading…</div>
        )}
        {!lp.loadingCashierDetails && lp.noTransMsg && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">No exceptions found.</div>
        )}
        {!lp.loadingCashierDetails && !lp.noTransMsg && visible.map((d) => {
          const storeName = assignedStores.find((s) => s.storeid === d.storeid)?.store_name ?? d.store_name;
          const isLoading = lp.fetchingCashierTransactions && lp.selectedStoreId === d.storeid;
          const t = d.trend;

          const gradedMetrics = [
            { label: "Trans", value: d.transaction_count.toLocaleString(), isPass: t ? d.transaction_count <= t.transaction_count : null },
            { label: "Items", value: d.total_items.toLocaleString(), isPass: t ? d.total_items <= t.total_items : null },
            ...(!noSale ? [
              { label: "Total", value: formatCurrency2(Math.abs(d.amount)), isPass: t ? Math.abs(d.amount) <= Math.abs(t.amount) : null },
              { label: "Avg $", value: formatCurrency2(Math.abs(d.average_dollars)), isPass: t ? Math.abs(d.average_dollars) <= Math.abs(t.average_dollars) : null },
            ] : []),
          ];

          return (
            <button
              key={d.storeid}
              onClick={() => handleStoreClick(d.storeid)}
              disabled={lp.fetchingCashierTransactions}
              className="w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 mb-2">
                {isLoading ? (
                  <div className="w-[22px] h-[22px] flex-shrink-0" />
                ) : (
                  <SevBadge sev={d.sev} />
                )}
                <div className="text-[13px] font-medium text-content truncate">{storeName}</div>
              </div>
              <div className="flex items-center gap-1 flex-wrap pl-[30px]">
                {gradedMetrics.map(({ label, value, isPass }) => (
                  <MetricChip key={label} label={label} value={value} isPass={isPass} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StoreListMobile;
