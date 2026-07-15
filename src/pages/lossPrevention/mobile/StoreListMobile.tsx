import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useApiContext } from "../../hooks";
import { getCashierDetails, getCashierTable, getTransactionList } from "../../../api/lossPrevention";
import { useLPState } from "../hooks/useLPState";
import { useLPActions } from "../hooks/useLPActions";
import type { JsonError, TransactionListItem, TransactionOverview, UniqueCashier } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import SevChips from "../../sales/mobile/components/SevChips";
import SevBadge from "../../sales/mobile/components/SevBadge";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import SelectFilter from "../../../components/filters/SelectFilter";
import { storeSeverity, isNoDollarType, weekRangeLabel } from "../gradingUtils";
import MetricChip from "./components/MetricChip";

interface Props {
  onOpenSearch: () => void;
  onStoreSelected: () => void;
}

const StoreListMobile = ({ onOpenSearch, onStoreSelected }: Props) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const params = useApiContext();
  const lp = useLPState();
  const actions = useLPActions();
  const search = useAppSelector((state) => state.search);
  const assignedStores = useAppSelector((state) => state.user.assignedStores);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

  const fetchDetails = (saleType: string) => {
    dispatch(actions.reQuery());
    dispatch(actions.setSelectedSaleType(saleType));
    dispatch(actions.setLoadingCashierDetails(true));
    getCashierDetails(params.url, params.token, params.lpStart, params.lpEnd, params.useGroups, params.searchValue, params.singleStore, [saleType])
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(actions.toggleNoTransMsg(j.sales.length === 0));
          dispatch(actions.setCashierDetails(j.sales));
          dispatch(actions.setCashierTrends(j.trend));
        }
      })
      .catch((err: JsonError) => toast.error("Error fetching store details: " + err.message))
      .finally(() => dispatch(actions.setLoadingCashierDetails(false)));
    getCashierDetails(params.url, params.token, params.lpBaseStart, params.lpBaseEnd, params.useGroups, params.searchValue, params.singleStore, [saleType])
      .then((r) => { if (r.data.error === 0) dispatch(actions.setBaselineDetails(r.data.sales)); })
      .catch(() => {});
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
    dispatch(actions.reQuery());
    dispatch(actions.setSelectedStoreId(storeid));
    dispatch(actions.setTransactionLoadingMessage("Loading cashiers…"));
    dispatch(actions.setFetchingCashierTransactions(true));
    dispatch(actions.setTransList([]));

    const saleType = lp.selectedSaleType;
    const [sm, sd, sy] = search.singleDate.split("/").map(Number);
    const endD       = new Date(sy, sm - 1, sd);
    const startD     = new Date(sy, sm - 1, sd - 6);
    const baseEndD   = new Date(sy, sm - 1, sd - 7);
    const baseStartD = new Date(sy, sm - 1, sd - 20);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const start     = fmt(startD);
    const end       = fmt(endD);
    const baseStart = fmt(baseStartD);
    const baseEnd   = fmt(baseEndD);

    getCashierTable(params.url, params.token, start, end, 0, storeid, 1, [saleType], 1, lp.searchString)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions = [...j.transactions];
          const allTrans = transactions.filter((item: any) => item.sale_type === saleType);

          const doFetch = (saleIds: string[]) => {
            dispatch(actions.setSelectedSaleIds(saleIds));
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

    // Baseline fetch — prior 2 weeks for cashier grading
    getCashierTable(params.url, params.token, baseStart, baseEnd, 0, storeid, 1, [saleType], 1, lp.searchString)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const baseTrans = j.transactions.filter((t: any) => t.sale_type === saleType);
          const fetchPages = j.total_pages > 1
            ? Array.from({ length: j.total_pages - 1 }, (_, i) =>
                getCashierTable(params.url, params.token, baseStart, baseEnd, 0, storeid, 1, [saleType], i + 2, lp.searchString)
                  .then((r) => r.data.error === 0 ? r.data.transactions.filter((t: any) => t.sale_type === saleType) : [])
              )
            : [];
          Promise.all(fetchPages).then((pages) => {
            pages.forEach((p) => baseTrans.push(...p));
            const overviews: TransactionOverview[] = baseTrans.reduce((acc: TransactionOverview[], curr: any) => {
              const txId = curr.sale_id.split("-")[1];
              const found = acc.find((o) => o.transaction_id === txId);
              if (!found) {
                acc.push({ transaction_id: txId, sale_date: curr.sale_date.split("T")[0], sale_type: curr.sale_type, store_number: curr.store_number, cashier_name: curr.cashier_name, cashier_number: curr.cashier_number, qty: 1, total_sales: curr.total_sales, sale_id: curr.sale_id, storeid: curr.storeid });
              } else {
                found.qty += 1;
                found.total_sales += curr.total_sales;
              }
              return acc;
            }, []);
            dispatch(actions.setBaselineOverviews(overviews));
          });
        }
      })
      .catch(() => { /* baseline failure is non-fatal */ });
  };

  const fetchTransactions = (saleIds: string[], saleType: string) => {
    dispatch(actions.setTransactionLoadingMessage("Loading transactions…"));
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
          dispatch(actions.setCashiers(uniqueCashiers));

          const formatted: TransactionListItem[] = newTrans.map((item) => ({ ...item, transaction_id: item.sale_id.split("-")[1], sale_date: item.sale_date.split("T")[0], qty: item.qty ?? 0 }));
          const overviews: TransactionOverview[] = formatted.reduce((acc: TransactionOverview[], curr) => {
            const found = acc.find((item) => item.transaction_id === curr.transaction_id);
            if (!found) {
              acc.push({ transaction_id: curr.transaction_id, sale_date: curr.sale_date, sale_type: curr.sale_type, store_number: curr.store_number, cashier_name: curr.cashier_name, cashier_number: curr.cashier_number, qty: 1, total_sales: curr.total_sales, sale_id: curr.sale_id, storeid: curr.storeid });
            } else {
              found.qty += 1;
              found.total_sales += curr.total_sales;
            }
            return acc;
          }, []);

          dispatch(actions.setTransOverviews(overviews));
          dispatch(actions.setTransList(formatted));
          onStoreSelected();
        }
      })
      .catch((err: JsonError) => toast.error("Error fetching transactions: " + err.message))
      .finally(() => { dispatch(actions.setFetchingCashierTransactions(false)); dispatch(actions.setTransactionLoadingMessage("")); });
  };

  const storesWithSev = useMemo(() => {
    return lp.cashierDetails.map((d) => {
      const trend = lp.cashierTrends.find((t) => t.storeid === d.storeid);
      const baseline = lp.baselineDetails.find((b) => b.storeid === d.storeid);
      const sev = storeSeverity(d, lp.baselineDetails, lp.selectedSaleType);
      return { ...d, sev, trend, baseline };
    });
  }, [lp.cashierDetails, lp.cashierTrends, lp.baselineDetails, lp.selectedSaleType]);

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

  const noSale = isNoDollarType(lp.selectedSaleType);
  const weekLabel = weekRangeLabel(search.singleDate);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-custom-white font-semibold text-[13px]">Exception Activity</div>
            <div className="text-custom-white/85 text-[11px] mt-0.5">{weekLabel}</div>
          </div>
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="flex-shrink-0 w-[28px] h-[28px] flex items-center justify-center rounded-md border border-custom-white/25 text-custom-white/85 hover:text-custom-white hover:border-custom-white/45 transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Exception type selector */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 bg-custom-white">
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
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">Loading…</div>
        )}
        {!lp.loadingCashierDetails && lp.noTransMsg && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">No exceptions found.</div>
        )}
        {!lp.loadingCashierDetails && !lp.noTransMsg && visible.map((d) => {
          const storeName = assignedStores.find((s) => s.storeid === d.storeid)?.store_name ?? d.store_name;
          const isLoading = lp.fetchingCashierTransactions && lp.selectedStoreId === d.storeid;
          const b = d.baseline;
          const bTrans  = b ? b.transaction_count / 2 : null;
          const bItems  = b ? b.total_items / 2 : null;
          const bAmount = b ? Math.abs(b.amount) / 2 : null;
          const bAvg    = b ? Math.abs(b.average_dollars) : null;

          const gradedMetrics = [
            { label: "Trans", value: d.transaction_count.toLocaleString(), isPass: bTrans !== null ? d.transaction_count <= bTrans : null },
            { label: "Items", value: d.total_items.toLocaleString(), isPass: bItems !== null ? d.total_items <= bItems : null },
            ...(!noSale ? [
              { label: "Total", value: formatCurrency2(Math.abs(d.amount)), isPass: bAmount !== null ? Math.abs(d.amount) <= bAmount : null },
              { label: "Avg $", value: formatCurrency2(Math.abs(d.average_dollars)), isPass: bAvg !== null ? Math.abs(d.average_dollars) <= bAvg : null },
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
