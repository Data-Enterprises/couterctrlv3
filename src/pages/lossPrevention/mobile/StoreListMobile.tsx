import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
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
  setViewTransactionsMobile,
  toggleNoTransMsg,
} from "../../../features/lossPreventionSlice";
import type { JsonError, TransactionListItem, TransactionOverview, UniqueCashier } from "../../../interfaces";
import { formatCurrency2, formatGoliathDate } from "../../../utils";
import SevChips from "../../sales/mobile/components/SevChips";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import type { CashierDetails, CashierTrend } from "../../../interfaces";
import SelectFilter from "../../../components/filters/SelectFilter";
import SevBadge from "../../sales/mobile/components/SevBadge";

interface Props {
  onBack: () => void;
  onOpenSearch: () => void;
}

const chipStyle = {
  background: "rgba(30,42,74,0.06)",
  boxShadow: "inset 0 1px 2px rgba(30,42,74,0.08)",
};


const getStoreSev = (detail: CashierDetails, trend: CashierTrend | undefined): "critical" | "watch" | "healthy" => {
  if (!trend) return "watch";
  let score = 0;
  if (detail.transaction_count < trend.transaction_count) score++;
  if (detail.total_items < trend.total_items) score++;
  if (Math.abs(detail.amount) < Math.abs(trend.amount)) score++;
  if (score >= 2) return "healthy";
  if (score === 1) return "watch";
  return "critical";
};

const sevToFilter = (sev: "critical" | "watch" | "healthy"): SevFilter => sev;

const StoreListMobile = ({ onBack, onOpenSearch }: Props) => {
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
    // const type = saleType === "Description" ? "description" : saleType;
    const type = saleType;
    getCashierDetails(params.url, params.token, params.start, params.end, params.useGroups, params.searchValue, params.singleStore, [type])
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
    dispatch(setSelectedSaleType(lp.selectedSaleType));
    dispatch(setTransactionLoadingMessage("Loading cashiers…"));
    dispatch(setSelectedStoreId(storeid));
    dispatch(setFetchingCashierTransactions(true));
    dispatch(setTransList([]));

    // const saleType = lp.selectedSaleType === "Description" ? "description" : lp.selectedSaleType;
    const saleType = lp.selectedSaleType;
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);

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

          const detail = lp.cashierDetails.find((d) => d.storeid === lp.selectedStoreId);
          const trend = lp.cashierTrends.find((t) => t.storeid === lp.selectedStoreId);
          if (detail) dispatch(setCashierDetails([detail]));
          if (trend) dispatch(setCashierTrends([trend]));

          dispatch(setViewTransactionsMobile(true));
        }
      })
      .catch((err: JsonError) => toast.error("Error fetching transactions: " + err.message))
      .finally(() => { dispatch(setFetchingCashierTransactions(false)); dispatch(setTransactionLoadingMessage("")); });
  };

  const storesWithSev = useMemo(() => {
    return lp.cashierDetails.map((d) => {
      const trend = lp.cashierTrends.find((t) => t.storeid === d.storeid);
      const sev = getStoreSev(d, trend);
      return { ...d, sev };
    });
  }, [lp.cashierDetails, lp.cashierTrends]);

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

  const totalSales  = visible.reduce((s, d) => s + d.amount, 0);
  const totalTrans  = visible.reduce((s, d) => s + d.transaction_count, 0);

  const startDate = search.startDate;
  const endDate   = search.endDate;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex-shrink-0">
        <div className="relative flex items-center justify-center mb-2">
          <button
            onClick={onBack}
            className="absolute left-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
            aria-label="Back to search"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </button>
          <div className="text-center px-8">
            <div className="text-white font-medium text-[13px]">Loss prevention</div>
            <div className="text-white/60 text-[10px] mt-0.5">{startDate} – {endDate}</div>
          </div>
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="absolute right-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: "Total",  value: formatCurrency2(totalSales) },
            { label: "Trans",  value: totalTrans.toLocaleString() },
            { label: "Stores", value: visible.length.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="text-[10px] text-white/50">{label}</div>
              <div className="text-[12px] font-medium text-white mt-0.5 truncate">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Exception dropdown */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 bg-white">
        <SelectFilter
          options={lp.saleTypes.filter((st) => st.sale_type !== "Description").map((st) => ({ value: st.sale_type, label: st.sale_type }))}
          value={lp.selectedSaleType}
          onChange={handleExceptionChange}
          placeholder=""
          className="w-full"
        />
      </div>

      {/* SevChips */}
      <SevChips active={sevFilter} counts={sevCounts} onChange={setSevFilter} />

      {/* Store list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {lp.loadingCashierDetails && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">Loading…</div>
        )}
        {!lp.loadingCashierDetails && lp.noTransMsg && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/70">No exceptions found.</div>
        )}
        {!lp.loadingCashierDetails && !lp.noTransMsg && visible.map((d, i) => {
          const storeName = assignedStores.find((s) => s.storeid === d.storeid)?.store_name ?? d.store_name;
          const isLoading = lp.fetchingCashierTransactions && lp.selectedStoreId === d.storeid;
          return (
            <button
              key={i}
              onClick={() => handleStoreClick(d.storeid)}
              disabled={lp.fetchingCashierTransactions}
              className="w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[13px] font-medium text-content truncate pr-2">{storeName}</div>
                {isLoading ? (
                  <span className="text-[10px] text-content/40">Loading…</span>
                ) : (
                  <SevBadge sev={d.sev} />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: "Total", value: formatCurrency2(d.amount) },
                  { label: "Trans", value: d.transaction_count.toLocaleString() },
                  { label: "Cashiers", value: d.cashier_count.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-baseline gap-1 rounded px-1.5 py-0.5" style={chipStyle}>
                    <span className="text-[9px] text-content/50">{label}</span>
                    <span className="text-[10px] font-semibold text-content">{value}</span>
                  </div>
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
