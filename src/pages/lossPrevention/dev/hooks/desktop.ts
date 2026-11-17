// Hooks
import { useState, useEffect, useRef } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useLossPreventionCtx } from ".";

// Redux
import {
  reQuery,
  setCashierDetails,
  setCashierTrends,
  setCashiers,
  setFetchingCashierTransactions,
  setSelectedCashierDetails,
  setSelectedSaleIds,
  setSelectedSaleType,
  setSelectedStoreId,
  setSelectedStoreNumber,
  setSelectedDay,
  setDayDetails,
  setDayBaselineDetails,
  setLoadingDay,
  setSaleTypes,
  setTransList,
  setTransModalOpen,
  setTransOverviews,
  setBaselineOverviews,
  setBaselineDetails,
  setTransactionDrillDown,
  setTransactionLoadingMessage,
  toggleNoTransMsg,
} from "../../../../features/dev/devLossPreventionSlice";

// API
import {
  getCashierDetails,
  getCashierTable,
  getTransactionIds,
  getAllTransactionList,
  getCashierTransaction,
} from "../../../../api/lossPrevention";

// Utils
import { scopeToStoreNumber } from "../../../../utils/storeIdentity";
import { reasonOf } from "../../../../utils/serverError";
import { chunkSales, shiftDays } from "../utils";
import { pickDefaultSaleType } from "../utils/grading";
import {
  baselineOverviewsOf,
  overviewsOf,
  sumByStore,
  uniqueCashiersOf,
  weekWindows,
} from "../utils/desktop";

// Interfaces
import type {
  CashierDetails,
  TransactionIdsResp,
  TransactionListItem,
  TransactionOverview,
} from "../../../../interfaces";

/**
 * The desktop page's fetches: an exception type (and its baseline), a single
 * day against the same weekday in the two weeks before, a store's
 * transactions and their baseline, one transaction's lines, and the
 * show-all view. The first exception type loads itself once the types land.
 */
export const useLPDesktop = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const cashier = useLossPreventionCtx();
  const { apiEnv, url, token, weekDate, params } = cashier;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const preferred = pickDefaultSaleType(cashier.saleTypes);
    if (
      preferred &&
      !cashier.selectedSaleType &&
      cashier.cashierDetails.length === 0
    ) {
      handleSaleTypeSelect(preferred.sale_type);
    }
  }, [cashier.saleTypes]);

  const handleSaleTypeSelect = (saleType: string) => {
    const panels = cashier.saleTypes;
    dispatch(setSelectedStoreId(0));
    dispatch(setSelectedStoreNumber(""));
    // Day data is per sale type, so it can't carry across a type change.
    dayCache.current = {};
    dispatch(setSelectedDay(null));
    dispatch(setDayDetails([]));
    dispatch(setDayBaselineDetails([]));
    dispatch(setCashierTrends([]));
    dispatch(setCashierDetails([]));
    dispatch(reQuery());
    dispatch(setSaleTypes(panels));
    dispatch(setSelectedSaleType(saleType));
    setLoading(true);

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
          if (j.sales.length === 0) {
            dispatch(toggleNoTransMsg(true));
          } else {
            dispatch(toggleNoTransMsg(false));
            dispatch(setCashierDetails(j.sales));
            dispatch(setCashierTrends(j.trend));
          }
        } else {
          toast.warn(j.msg);
        }
      })
      .catch((err) => toast.error(reasonOf(err)))
      .finally(() => setLoading(false));
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
        if (r.data.error === 0) dispatch(setBaselineDetails(r.data.sales));
        else toast.warn(r.data.msg);
      })
      .catch(() => {});
  };

  const fetchTransactions = (saleIds: string[], saleType: string) => {
    dispatch(setTransactionLoadingMessage("Loading Transactions..."));
    getAllTransactionList(url, token, saleIds, saleType, cashier.searchString)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const newTrans = [...j.transactions];
          const uniqueCashiers = uniqueCashiersOf(newTrans);

          dispatch(setCashiers(uniqueCashiers));

          const formatted: TransactionListItem[] = newTrans.map((item) => ({
            ...item,
            transaction_id: item.sale_id.split("-")[1],
            sale_date: item.sale_date.split("T")[0],
            qty: item.qty ?? 0,
          }));

          const overviews = overviewsOf(formatted);

          dispatch(setTransOverviews(overviews));
          dispatch(setTransList(formatted));
        } else {
          toast.warn(j.msg);
        }
      })
      .catch((err) => toast.error(reasonOf(err)))
      .finally(() => {
        dispatch(setFetchingCashierTransactions(false));
        dispatch(setTransactionLoadingMessage(""));
      });
  };

  // Day filter for the store list.
  //
  // cashiers/ returns one aggregated row per store for the whole range, and its
  // baseline ("trend") carries no date, so a single day can't be sliced out of
  // what's already loaded — it needs its own calls. Three per day: the day
  // itself, plus the same weekday in each of the two baseline weeks (D-7, D-14,
  // both of which fall inside the existing lpBaseStart..lpBaseEnd window).
  //
  // The two baseline days are summed per store, so LPStorePanel's existing
  // "divide the baseline by 2" grading applies unchanged — one day now against
  // the average of the same weekday twice.
  const dayCache = useRef<
    Record<string, { details: CashierDetails[]; baseline: CashierDetails[] }>
  >({});

  const handleDaySelect = (day: string | null) => {
    dispatch(setSelectedDay(day));
    if (!day) {
      dispatch(setDayDetails([]));
      dispatch(setDayBaselineDetails([]));
      return;
    }
    const cached = dayCache.current[day];
    if (cached) {
      dispatch(setDayDetails(cached.details));
      dispatch(setDayBaselineDetails(cached.baseline));
      return;
    }
    const saleType = cashier.selectedSaleType;
    const fetchDay = (d: string) =>
      getCashierDetails(
        url,
        token,
        d,
        d,
        // Must mirror the week-level call — hardcoding 0 here silently returned
        // nothing for group searches, where searchValue is a group id.
        params.useGroups,
        params.searchValue,
        params.singleStore,
        [saleType],
      )
        .then((r) =>
          r.data.error === 0 ? (r.data.sales as CashierDetails[]) : [],
        )
        .catch(() => [] as CashierDetails[]);

    dispatch(setLoadingDay(true));
    Promise.all([
      fetchDay(day),
      fetchDay(shiftDays(day, -7)),
      fetchDay(shiftDays(day, -14)),
    ])
      .then(([today, lastWeek, twoWeeks]) => {
        const details = today;
        const baseline = sumByStore([...lastWeek, ...twoWeeks]);
        dayCache.current[day] = { details, baseline };
        dispatch(setDayDetails(details));
        dispatch(setDayBaselineDetails(baseline));
      })
      .finally(() => dispatch(setLoadingDay(false)));
  };

  const handleStoreSelect = (detail: CashierDetails) => {
    // Both halves of the key — co-located stores share a storeid, so the id
    // alone would treat a click on the sibling as a click on the current row
    // and bail out without loading anything.
    if (
      cashier.selectedStoreId === detail.storeid &&
      cashier.selectedStoreNumber === detail.store_number
    )
      return;

    dispatch(reQuery());
    dispatch(setTransactionLoadingMessage("Loading Cashiers..."));
    dispatch(setSelectedStoreId(detail.storeid));
    dispatch(setSelectedStoreNumber(detail.store_number));
    dispatch(setSelectedCashierDetails(detail));
    dispatch(setFetchingCashierTransactions(true));
    dispatch(setTransList([]));

    const saleType = cashier.selectedSaleType;
    const { start, end, baseStart, baseEnd } = weekWindows(weekDate);

    // Off until `cashiers/transaction_ids` is deployed to the dev server — it
    // isn't yet, so dev falls through to the `cashier_table` walk prod uses.
    // Flip to true once the endpoint is live on dev.
    const useTransactionIdsEndpoint = false;

    // Dev: the ids in one request, instead of walking every page of
    // `cashier_table` to keep one column of it.
    //
    // This path deliberately does NOT narrow to `detail.store_number`. The
    // store row it was launched from comes from `/cashiers/`, which groups by
    // storeid and reports `min(store_number)` — so the row's own totals
    // already cover every location under that storeid, and narrowing the
    // transactions beneath it to one of them is what made the two disagree.
    // A co-located store's second location had no row leading to it at all.
    // Storeid plus the selected exception is the whole question being asked.
    if (apiEnv === "dev" && useTransactionIdsEndpoint) {
      getTransactionIds(url, token, start, end, 0, detail.storeid, 1, [
        saleType,
      ])
        .then((resp) => {
          const j = resp.data as TransactionIdsResp;
          if (j.error !== 0) {
            toast.warn(j.msg || "Could not load transactions");
            return;
          }
          // Already distinct and already capped server-side; the Set the walk
          // below needs exists only because product-grain rows repeat an id
          // once per product.
          const saleIds = j.transaction_ids;
          dispatch(setSelectedSaleIds(saleIds));
          fetchTransactions(saleIds, saleType);
        })
        .catch((err) => toast.error(reasonOf(err)));
    } else
      getCashierTable(
        url,
        token,
        start,
        end,
        0,
        detail.storeid,
        1,
        [saleType],
        1,
        cashier.searchString,
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            // Fetched by storeid, which for co-located stores returns both
            // locations — narrow to the one that was clicked.
            const transactions = scopeToStoreNumber(
              [...j.transactions],
              detail.store_number,
            );
            const allTrans = transactions.filter(
              (item) => item.sale_type === saleType,
            );

            if (j.total_pages > 1) {
              const pages: { page: number; fetched: boolean }[] = [];
              for (let page = 2; page <= j.total_pages; page++) {
                pages.push({ page, fetched: false });
              }
              for (let page = 2; page <= j.total_pages; page++) {
                getCashierTable(
                  url,
                  token,
                  start,
                  end,
                  0,
                  detail.storeid,
                  1,
                  [saleType],
                  page,
                  cashier.searchString,
                )
                  .then((resp) => {
                    const j = resp.data;
                    if (j.error === 0) {
                      allTrans.push(
                        ...scopeToStoreNumber(
                          j.transactions,
                          detail.store_number,
                        ).filter((t: any) => t.sale_type === saleType),
                      );
                    }
                  })
                  .catch((err) => toast.error(reasonOf(err)))
                  .finally(() => {
                    pages.find((p) => p.page === page)!.fetched = true;
                    if (pages.every((p) => p.fetched)) {
                      const saleIds = Array.from(
                        new Set(allTrans.map((t) => t.sale_id)),
                      );
                      fetchTransactions(saleIds, saleType);
                    }
                  });
              }
            } else {
              const saleIds = Array.from(
                new Set(transactions.map((item) => item.sale_id)),
              );
              dispatch(setSelectedSaleIds(saleIds));
              fetchTransactions(saleIds, saleType);
            }
          } else {
            toast.warn(j.msg);
          }
        })
        .catch((err) => toast.error(reasonOf(err)));

    // Baseline fetch — prior 2 weeks, used for cashier grading
    getCashierTable(
      url,
      token,
      baseStart,
      baseEnd,
      0,
      detail.storeid,
      1,
      [saleType],
      1,
      cashier.searchString,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const baseTrans = j.transactions.filter(
            (t: any) => t.sale_type === saleType,
          );
          const fetchPages =
            j.total_pages > 1
              ? Array.from({ length: j.total_pages - 1 }, (_, i) =>
                  getCashierTable(
                    url,
                    token,
                    baseStart,
                    baseEnd,
                    0,
                    detail.storeid,
                    1,
                    [saleType],
                    i + 2,
                    cashier.searchString,
                  ).then((r) =>
                    r.data.error === 0
                      ? r.data.transactions.filter(
                          (t: any) => t.sale_type === saleType,
                        )
                      : [],
                  ),
                )
              : [];
          Promise.all(fetchPages).then((pages) => {
            pages.forEach((p) => baseTrans.push(...p));
            const overviews = baselineOverviewsOf(baseTrans);
            dispatch(setBaselineOverviews(overviews));
          });
        } else {
          toast.warn(j.msg);
        }
      })
      .catch(() => {
        /* baseline failure is non-fatal */
      });
  };

  const handleTransactionClick = (overview: TransactionOverview) => {
    const saleDate = overview.sale_date.split("T")[0];
    dispatch(setTransactionDrillDown([]));
    getCashierTransaction(
      url,
      token,
      saleDate,
      overview.sale_id,
      overview.storeid,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions: TransactionListItem[] = [...j.transaction].map(
            (item) => ({
              ...item,
              transaction_id: item.sale_id.split("-")[1],
              qty: item.qty ?? 0,
            }),
          );
          dispatch(setTransactionDrillDown([transactions]));
        } else {
          toast.warn(j.msg);
        }
      })
      .catch((err) => {
        dispatch(setTransModalOpen(false));
        toast.error(reasonOf(err));
      });
  };

  const handleShowAll = (filtered: TransactionListItem[]) => {
    const chunked = chunkSales(filtered);
    dispatch(setTransactionDrillDown(chunked));
    dispatch(setTransModalOpen(true));
  };

  return {
    loading,
    handleSaleTypeSelect,
    handleDaySelect,
    handleStoreSelect,
    handleTransactionClick,
    handleShowAll,
  };
};
