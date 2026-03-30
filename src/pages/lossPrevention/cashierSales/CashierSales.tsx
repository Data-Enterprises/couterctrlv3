import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { cashierDetailCols, theme } from ".";

import {
  getCashierTable,
  getTransactionList,
} from "../../../api/lossPrevention";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
} from "ag-grid-community";
import type {
  CashierDetails,
  JsonError,
  TransactionListItem,
  TransactionOverview,
  UniqueCashier,
} from "../../../interfaces";
import {
  reQuery,
  setCashiers,
  setCashierTransactions,
  setCurrentGridPage,
  setFetchingCashierTransactions,
  setGridPages,
  setSelectedCashierDetails,
  setSelectedSaleIds,
  setSelectedStoreId,
  setTransList,
  setTransOverviews,
} from "../../../features/lossPreventionSlice";
import { formatGoliathDate } from "../../../utils";
import { useEffect } from "react";
import CashierTrendCard from "./CashierTrendCard";
ModuleRegistry.registerModules([AllCommunityModule]);

const CashierSales = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const cashier = useAppSelector((state) => state.lossPrevention);

  useEffect(() => {
    if (!cashier.selectedStoreId) {
      // here we're either fetching new exceptions
      // or data for a different exception type that we already have
      // therefore we need to reset this to null
      dispatch(setSelectedCashierDetails(null));
    } else {
      // find the trend here and its index => pass both into the card
      // => card will take care of the rest
      const details = cashier.cashierDetails.filter(
        (d) => d.storeid === cashier.selectedStoreId,
      )[0];
      dispatch(setSelectedCashierDetails(details));
    }
  }, [cashier.selectedStoreId]);

  const handleRowClicked = (e: RowClickedEvent) => {
    const data: CashierDetails = e.data;
    if (cashier.selectedStoreId === data.storeid) return;

    dispatch(reQuery());
    dispatch(setSelectedStoreId(data.storeid));
    dispatch(setFetchingCashierTransactions(true));
    dispatch(setTransList([]));
    const saleType =
      cashier.selectedSaleType === "Description"
        ? "description"
        : cashier.selectedSaleType;

    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    getCashierTable(
      url,
      token,
      start,
      end,
      0,
      data.storeid,
      1,
      [saleType],
      1,
      cashier.searchString,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions = [...j.transactions];
          dispatch(setCashierTransactions(transactions));
          dispatch(setCurrentGridPage(1));
          dispatch(setGridPages(j.total_pages));

          const saleIds = Array.from(
            new Set(transactions.map((item) => item.sale_id)),
          );
          dispatch(setSelectedSaleIds(saleIds));

          // call the api
          getTransactionList(
            url,
            token,
            saleIds,
            1,
            saleType,
            cashier.searchString,
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
                const formatted: TransactionListItem[] = [
                  ...j.transactions,
                ].map((item) => {
                  const transactionId = item.sale_id.split("-")[1];
                  return {
                    ...item,
                    transaction_id: transactionId,
                    sale_date: item.sale_date.split("T")[0],
                    qty: item.qty ? item.qty : 0,
                  };
                });

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
            });
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const showTrendCard = () => {
    return (
      cashier.selectedStoreId > 0 &&
      cashier.selectedCashierDetails !== null &&
      cashier.selectedCashierDetailsIdx > -1
    );
  };

  return (
    <div className="grid grid-cols-[64%_35%] gap-4 h-[24vh]">
      <div className="bg-custom-white rounded-lg shadow-lg ">
        <AgGridReact
          rowData={cashier.cashierDetails}
          columnDefs={cashierDetailCols}
          theme={theme}
          rowSelection="single"
          onRowClicked={handleRowClicked}
          pagination={true}
          paginationAutoPageSize={true}
        />
      </div>

      <div className="bg-custom-white rounded-lg shadow-lg">
        {!showTrendCard() ? (
          <div className="text-sm flex justify-center items-center h-full">
            <div className="text-center font-medium text-content/70">
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

export default CashierSales;
