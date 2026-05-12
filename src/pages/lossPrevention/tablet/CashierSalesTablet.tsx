import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import {
  getCashierTable,
  getTransactionList,
} from "../../../api/lossPrevention";

import type {
  JsonError,
  TransactionListItem,
  TransactionOverview,
  UniqueCashier,
} from "../../../interfaces";
import {
  reQuery,
  setCashiers,
  setFetchingCashierTransactions,
  setSelectedCashierDetails,
  setSelectedSaleIds,
  setSelectedStoreId,
  setTransactionLoadingMessage,
  setTransList,
  setTransOverviews,
} from "../../../features/lossPreventionSlice";
import { formatGoliathDate } from "../../../utils";
import { useEffect } from "react";
import CashierTrendCard from "../cashierSales/CashierTrendCard";

const CashierSalesTablet = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const lp = useAppSelector((state) => state.lossPrevention);

  useEffect(() => {
    if (!lp.selectedStoreId) {
      // here we're either fetching new exceptions
      // or data for a different exception type that we already have
      // therefore we need to reset this to null
      dispatch(setSelectedCashierDetails(null));
    } else {
      // find the trend here and its index => pass both into the card
      // => card will take care of the rest
      const details = lp.cashierDetails.filter(
        (d) => d.storeid === lp.selectedStoreId,
      )[0];
      dispatch(setSelectedCashierDetails(details));
    }
  }, [lp.selectedStoreId]);

  const handleStoreClicked = (storeid: number) => {
    if (lp.selectedStoreId === storeid) return;

    dispatch(reQuery());
    dispatch(setTransactionLoadingMessage("Loading Cashiers..."));
    dispatch(setSelectedStoreId(storeid));
    dispatch(setFetchingCashierTransactions(true));
    dispatch(setTransList([]));
    const saleType =
      lp.selectedSaleType === "Description"
        ? "description"
        : lp.selectedSaleType;

    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    getCashierTable(
      url,
      token,
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
          const transactions = [...j.transactions];
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
                storeid,
                1,
                [saleType],
                page,
                lp.searchString,
              ).then((resp) => {
                const j = resp.data;
                if (j.error === 0) {
                  allTrans.push(
                    ...j.transactions.filter(
                      (t: any) => t.sale_type === saleType,
                    ),
                  );
                  pages.find((p) => p.page === page)!.fetched = true;

                  if (pages.every((p) => p.fetched)) {
                    const saleIds = Array.from(
                      new Set(allTrans.map((t) => t.sale_id)),
                    );
                    fetchTransactions(saleIds, saleType);
                  }
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
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const fetchTransactions = (saleIds: string[], saleType: string) => {
    dispatch(setTransactionLoadingMessage("Loading Transactions..."));
    getTransactionList(url, token, saleIds, 1, saleType, lp.searchString)
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
                // if found but the transaction_id is not in the array, add it and increment transaction_count by 1
                // else, do nothing since the unique transaction_id is already accounted for
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

          // Everything below is going inside the then block of the cashier_table call
          dispatch(setCashiers(uniqueCashiers));
          const formatted: TransactionListItem[] = [...j.transactions].map(
            (item) => {
              const transactionId = item.sale_id.split("-")[1];
              return {
                ...item,
                transaction_id: transactionId,
                sale_date: item.sale_date.split("T")[0],
                qty: item.qty ? item.qty : 0,
              };
            },
          );

          const overviews: TransactionOverview[] = [...formatted].reduce(
            (acc: TransactionOverview[], curr: TransactionListItem) => {
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
                  qty: curr.qty ? curr.qty : 0,
                  total_sales: curr.total_sales,
                  sale_id: curr.sale_id,
                  storeid: curr.storeid,
                });
              } else {
                found.qty += curr.qty ? curr.qty : 0;
                found.total_sales += curr.total_sales;
              }
              return acc;
            },
            [],
          );
          dispatch(setTransOverviews(overviews));
          dispatch(setTransList(formatted));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching transactions: " + err.message),
      )
      .finally(() => {
        dispatch(setFetchingCashierTransactions(false));
        dispatch(setTransactionLoadingMessage(""));
      });
  };

  const showTrendCard = () => {
    return (
      lp.selectedStoreId > 0 &&
      lp.selectedCashierDetails !== null &&
      lp.selectedCashierDetailsIdx > -1
    );
  };

  return (
    <div className="space-y-3">
      <div className="bg-custom-white p-3 rounded-xl shadow-md leading-tight">
        <div className="font-medium mb-1">Stores</div>
        <div className="flex flex-wrap gap-2 max-h-[9rem] overflow-y-auto">
          {lp.cashierDetails.map((d, i) => (
            <div
              key={i}
              className={`transition-all duration-200 ${lp.selectedStoreId === d.storeid ? "bg-orange-200" : "bg-bkg"} rounded-full shadow-md px-3 py-1.5`}
              onClick={() => handleStoreClicked(d.storeid)}
            >
              {d.store_name}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-custom-white rounded-lg shadow-lg">
        {!showTrendCard() ? (
          <div className="text-sm md:text-[13px] flex flex-col justify-center items-center h-full p-4 md:p-6">
            <div className="text-center font-medium text-content/70 space-y-1">
              <div>Select a store to view</div>
              <div>Trend Data (here)</div>
              <div>List of transactions (below)</div>
            </div>
          </div>
        ) : (
          <CashierTrendCard />
        )}
      </div>
    </div>
  );
};

export default CashierSalesTablet;
