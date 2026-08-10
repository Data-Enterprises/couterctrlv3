import { useEffect, useMemo, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useApiContext } from "../../hooks";
import {
  applyStoreNumberToName,
  scopeToStoreNumber,
} from "../../../utils/storeIdentity";
import {
  getCashierDetails,
  getCashierTable,
  getTransactionList,
} from "../../../api/lossPrevention";
import { useLPState } from "../hooks/useLPState";
import { useLPActions } from "../hooks/useLPActions";
import type {
  JsonError,
  TransactionListItem,
  TransactionOverview,
  UniqueCashier,
} from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import SevChips from "../../../components/SevChips";
import MobilePerfHeader from "../../../components/mobile/MobilePerfHeader";
import { useSearchScopeLabel } from "../../../hooks/useSearchScopeLabel";
import { LP_INFO } from "../lpInfo";
import SevBadge from "../../../components/SevBadge";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import SelectFilter from "../../../components/filters/SelectFilter";
import {
  storeSeverity,
  isNoDollarType,
  weekRangeLabel,
  pickDefaultSaleType,
} from "../gradingUtils";
import MetricChip from "./components/MetricChip";

interface Props {
  onOpenSearch: () => void;
  onStoreSelected: () => void;
}

const StoreListMobile = ({ onOpenSearch, onStoreSelected }: Props) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const scopeLabel = useSearchScopeLabel();
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
    getCashierDetails(
      params.url,
      params.token,
      params.lpStart,
      params.lpEnd,
      params.useGroups,
      params.searchValue,
      params.singleStore,
      [saleType],
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(actions.toggleNoTransMsg(j.sales.length === 0));
          dispatch(actions.setCashierDetails(j.sales));
          dispatch(actions.setCashierTrends(j.trend));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching store details: " + err.message),
      )
      .finally(() => dispatch(actions.setLoadingCashierDetails(false)));
    getCashierDetails(
      params.url,
      params.token,
      params.lpBaseStart,
      params.lpBaseEnd,
      params.useGroups,
      params.searchValue,
      params.singleStore,
      [saleType],
    )
      .then((r) => {
        if (r.data.error === 0)
          dispatch(actions.setBaselineDetails(r.data.sales));
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Same landing-tab rule as desktop — saleTypes[0] is Backup, which is
    // almost always empty. See pickDefaultSaleType.
    const preferred = pickDefaultSaleType(lp.saleTypes);
    if (preferred && !lp.selectedSaleType && lp.cashierDetails.length === 0) {
      fetchDetails(preferred.sale_type);
    }
  }, [lp.saleTypes]);

  const handleExceptionChange = (saleType: string) => {
    fetchDetails(saleType);
  };

  const handleStoreClick = (storeid: number, storeNumber: string) => {
    if (lp.fetchingCashierTransactions) return;
    dispatch(actions.reQuery());
    dispatch(actions.setSelectedStoreId(storeid));
    dispatch(actions.setSelectedStoreNumber(storeNumber));
    dispatch(actions.setTransactionLoadingMessage("Loading cashiers…"));
    dispatch(actions.setFetchingCashierTransactions(true));
    dispatch(actions.setTransList([]));

    const saleType = lp.selectedSaleType;
    const [sm, sd, sy] = search.singleDate.split("/").map(Number);
    const endD = new Date(sy, sm - 1, sd);
    const startD = new Date(sy, sm - 1, sd - 6);
    const baseEndD = new Date(sy, sm - 1, sd - 7);
    const baseStartD = new Date(sy, sm - 1, sd - 20);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const start = fmt(startD);
    const end = fmt(endD);
    const baseStart = fmt(baseStartD);
    const baseEnd = fmt(baseEndD);

    getCashierTable(
      params.url,
      params.token,
      start,
      end,
      0,
      storeid,
      1,
      [saleType],
      1,
      lp.searchString,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          // Fetched by storeid, which for co-located stores returns both
          // locations — narrow to the one that was tapped.
          const transactions = scopeToStoreNumber(
            [...j.transactions],
            storeNumber,
          );
          const allTrans = transactions.filter(
            (item: any) => item.sale_type === saleType,
          );

          const doFetch = (saleIds: string[]) => {
            dispatch(actions.setSelectedSaleIds(saleIds));
            fetchTransactions(saleIds, saleType);
          };

          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++)
              pages.push({ page, fetched: false });
            for (let page = 2; page <= j.total_pages; page++) {
              getCashierTable(
                params.url,
                params.token,
                start,
                end,
                0,
                storeid,
                1,
                [saleType],
                page,
                lp.searchString,
              ).then((r2) => {
                if (r2.data.error === 0) {
                  allTrans.push(
                    ...scopeToStoreNumber(
                      r2.data.transactions,
                      storeNumber,
                    ).filter((t: any) => t.sale_type === saleType),
                  );
                  pages.find((p) => p.page === page)!.fetched = true;
                  if (pages.every((p) => p.fetched))
                    doFetch(
                      Array.from(new Set(allTrans.map((t: any) => t.sale_id))),
                    );
                }
              });
            }
          } else {
            doFetch(
              Array.from(
                new Set(transactions.map((item: any) => item.sale_id)),
              ),
            );
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message));

    // Baseline fetch — prior 2 weeks for cashier grading
    getCashierTable(
      params.url,
      params.token,
      baseStart,
      baseEnd,
      0,
      storeid,
      1,
      [saleType],
      1,
      lp.searchString,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const baseTrans = scopeToStoreNumber(
            j.transactions,
            storeNumber,
          ).filter((t: any) => t.sale_type === saleType);
          const fetchPages =
            j.total_pages > 1
              ? Array.from({ length: j.total_pages - 1 }, (_, i) =>
                  getCashierTable(
                    params.url,
                    params.token,
                    baseStart,
                    baseEnd,
                    0,
                    storeid,
                    1,
                    [saleType],
                    i + 2,
                    lp.searchString,
                  ).then((r) =>
                    r.data.error === 0
                      ? scopeToStoreNumber(
                          r.data.transactions,
                          storeNumber,
                        ).filter((t: any) => t.sale_type === saleType)
                      : [],
                  ),
                )
              : [];
          Promise.all(fetchPages).then((pages) => {
            pages.forEach((p) => baseTrans.push(...p));
            const overviews: TransactionOverview[] = baseTrans.reduce(
              (acc: TransactionOverview[], curr: any) => {
                const txId = curr.sale_id.split("-")[1];
                const found = acc.find((o) => o.transaction_id === txId);
                if (!found) {
                  acc.push({
                    transaction_id: txId,
                    sale_date: curr.sale_date.split("T")[0],
                    sale_type: curr.sale_type,
                    store_number: curr.store_number,
                    cashier_name: curr.cashier_name,
                    cashier_number: curr.cashier_number,
                    qty: 1,
                    total_sales: curr.total_sales,
                    sale_id: curr.sale_id,
                    storeid: curr.storeid,
                  });
                } else {
                  found.qty += 1;
                  found.total_sales += curr.total_sales;
                }
                return acc;
              },
              [],
            );
            dispatch(actions.setBaselineOverviews(overviews));
          });
        }
      })
      .catch(() => {
        /* baseline failure is non-fatal */
      });
  };

  const fetchTransactions = (saleIds: string[], saleType: string) => {
    dispatch(actions.setTransactionLoadingMessage("Loading transactions…"));
    getTransactionList(
      params.url,
      params.token,
      saleIds,
      1,
      saleType,
      lp.searchString,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const newTrans = [...j.transactions];
          const uniqueCashiers = newTrans.reduce(
            (acc: UniqueCashier[], curr) => {
              const found = acc.find(
                (item) => item.cashier_number === curr.cashier_number,
              );
              if (!found) {
                acc.push({
                  cashier_name: curr.cashier_name,
                  cashier_number: curr.cashier_number,
                  total_sales: curr.total_sales,
                  transaction_count: 1,
                  store_number: curr.store_number,
                  transaction_ids: [curr.sale_id],
                });
              } else {
                if (!found.transaction_ids.includes(curr.sale_id)) {
                  found.transaction_ids.push(curr.sale_id);
                  found.transaction_count += 1;
                }
                found.total_sales += curr.total_sales;
              }
              return acc;
            },
            [],
          );
          dispatch(actions.setCashiers(uniqueCashiers));

          const formatted: TransactionListItem[] = newTrans.map((item) => ({
            ...item,
            transaction_id: item.sale_id.split("-")[1],
            sale_date: item.sale_date.split("T")[0],
            qty: item.qty ?? 0,
          }));
          const overviews: TransactionOverview[] = formatted.reduce(
            (acc: TransactionOverview[], curr) => {
              const found = acc.find(
                (item) => item.transaction_id === curr.transaction_id,
              );
              if (!found) {
                acc.push({
                  transaction_id: curr.transaction_id,
                  sale_date: curr.sale_date,
                  sale_type: curr.sale_type,
                  store_number: curr.store_number,
                  cashier_name: curr.cashier_name,
                  cashier_number: curr.cashier_number,
                  qty: 1,
                  total_sales: curr.total_sales,
                  sale_id: curr.sale_id,
                  storeid: curr.storeid,
                });
              } else {
                found.qty += 1;
                found.total_sales += curr.total_sales;
              }
              return acc;
            },
            [],
          );

          dispatch(actions.setTransOverviews(overviews));
          dispatch(actions.setTransList(formatted));
          onStoreSelected();
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching transactions: " + err.message),
      )
      .finally(() => {
        dispatch(actions.setFetchingCashierTransactions(false));
        dispatch(actions.setTransactionLoadingMessage(""));
      });
  };

  // storeid -> every store_number returned under it.
  const numbersByStoreId = useMemo(
    () =>
      lp.cashierDetails.reduce((acc: Record<number, string[]>, d) => {
        const nums = (acc[d.storeid] ??= []);
        if (!nums.includes(d.store_number)) nums.push(d.store_number);
        return acc;
      }, {}),
    [lp.cashierDetails],
  );

  const storesWithSev = useMemo(() => {
    return lp.cashierDetails.map((d) => {
      // storeid + store_number: co-located stores share an id, so matching on
      // the id alone gives both rows the same sibling's trend and baseline.
      const trend = lp.cashierTrends.find(
        (t) => t.storeid === d.storeid && t.store_number === d.store_number,
      );
      const baseline = lp.baselineDetails.find(
        (b) => b.storeid === d.storeid && b.store_number === d.store_number,
      );
      const sev = storeSeverity(d, lp.baselineDetails, lp.selectedSaleType);
      return { ...d, sev, trend, baseline };
    });
  }, [
    lp.cashierDetails,
    lp.cashierTrends,
    lp.baselineDetails,
    lp.selectedSaleType,
  ]);

  const sevCounts = useMemo(
    () => ({
      all: storesWithSev.length,
      critical: storesWithSev.filter((s) => s.sev === "critical").length,
      watch: storesWithSev.filter((s) => s.sev === "watch").length,
      healthy: storesWithSev.filter((s) => s.sev === "healthy").length,
    }),
    [storesWithSev],
  );

  const visible = useMemo(() => {
    if (sevFilter === "all") return storesWithSev;
    return storesWithSev.filter((s) => s.sev === sevFilter);
  }, [storesWithSev, sevFilter]);

  const noSale = isNoDollarType(lp.selectedSaleType);
  const weekLabel = weekRangeLabel(search.singleDate);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {/* No threshold: LP grades each cashier against their own baseline, not
          a number the user sets. */}
      <MobilePerfHeader
        pageName="Loss Prevention"
        dateRange={weekLabel}
        storeName={scopeLabel}
        onSearch={onOpenSearch}
        info={LP_INFO}
      />

      {/* Exception type selector */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 bg-custom-white">
        <SelectFilter
          options={lp.saleTypes
            .filter((st) => st.sale_type !== "Description")
            .map((st) => ({ value: st.sale_type, label: st.sale_type }))}
          value={lp.selectedSaleType}
          onChange={handleExceptionChange}
          placeholder=""
          className="w-full"
        />
      </div>

      {/* Sev filter chips */}
      <SevChips active={sevFilter} counts={sevCounts} onChange={setSevFilter} />

      {/* Store list */}
      <div className="flex-1 overflow-y-auto pb-14 thin-scrollbar">
        {lp.loadingCashierDetails && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            Loading…
          </div>
        )}
        {!lp.loadingCashierDetails && lp.noTransMsg && (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            No exceptions found.
          </div>
        )}
        {!lp.loadingCashierDetails &&
          !lp.noTransMsg &&
          visible.map((d) => {
            // assignedStores resolves by storeid, so co-located locations share
            // a name — rewrite the embedded number to this row's own.
            const storeName = applyStoreNumberToName(
              assignedStores.find((s) => s.storeid === d.storeid)?.store_name ??
                d.store_name,
              d.store_number,
              numbersByStoreId[d.storeid] ?? [],
            );
            const isLoading =
              lp.fetchingCashierTransactions &&
              lp.selectedStoreId === d.storeid;
            const b = d.baseline;
            const bTrans = b ? b.transaction_count / 2 : null;
            const bItems = b ? b.total_items / 2 : null;
            const bAmount = b ? Math.abs(b.amount) / 2 : null;
            const bAvg = b ? Math.abs(b.average_dollars) : null;

            const gradedMetrics = [
              {
                label: "Trans",
                value: d.transaction_count.toLocaleString(),
                isPass: bTrans !== null ? d.transaction_count <= bTrans : null,
              },
              {
                label: "Qty",
                value: d.total_items.toLocaleString(),
                isPass: bItems !== null ? d.total_items <= bItems : null,
              },
              ...(!noSale
                ? [
                    {
                      label: "Total $",
                      value: formatCurrency2(Math.abs(d.amount)),
                      isPass:
                        bAmount !== null ? Math.abs(d.amount) <= bAmount : null,
                    },
                    {
                      label: "Avg $",
                      value: formatCurrency2(Math.abs(d.average_dollars)),
                      isPass:
                        bAvg !== null
                          ? Math.abs(d.average_dollars) <= bAvg
                          : null,
                    },
                  ]
                : []),
            ];

            return (
              <button
                key={`${d.storeid}__${d.store_number}`}
                onClick={() => handleStoreClick(d.storeid, d.store_number)}
                disabled={lp.fetchingCashierTransactions}
                aria-busy={isLoading}
                // Dim the row while its cashiers load rather than pulling
                // anything out of it — see the badge below.
                className={`w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-opacity transition-colors ${
                  isLoading ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  {/* Always rendered. Swapping the badge for an empty box
                      while the cashiers load made the row's grade blink out
                      and leave a hole at the moment of tapping it — the row
                      dims instead, and the severity stays put. */}
                  <SevBadge sev={d.sev} />
                  <div className="text-[13px] font-medium text-content truncate">
                    {storeName}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap pl-[30px]">
                  {gradedMetrics.map(({ label, value, isPass }) => (
                    <MetricChip
                      key={label}
                      label={label}
                      value={value}
                      isPass={isPass}
                    />
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
