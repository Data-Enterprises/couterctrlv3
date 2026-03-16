import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { colDefs, theme, reducePriceTypes, reduceSaleIds } from ".";
import { useToast } from "../../components/toasts/hooks/useToast";
import {
  getCashierTable,
  getCashierTransaction,
  getTransactionList,
} from "../../api/cashiers";
import {
  setAvailablePriceTypes,
  setCashiers,
  setCashierSaleIds,
  setCashierTransactions,
  setCurrentGridPage,
  setFetchingCashierTransactions,
  setPageText,
  setSelectedSaleIds,
  setTransactionDrillDown,
  setTransList,
  setTransModalOpen,
} from "../../features/cashierSlice";
import type {
  JsonError,
  TransactionListItem,
  UniqueCashier,
} from "../../interfaces";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClickedEvent,
} from "ag-grid-community";
import { formatDate, formatGoliathDate } from "../../utils";
ModuleRegistry.registerModules([AllCommunityModule]);

import ExportModal from "./export/ExportModal";
import Input from "../../components/inputs/Input";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

const CashiersTable = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [filtered, setFiltered] = useState<TransactionListItem[]>([]);
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const cashier = useAppSelector((state) => state.cashier);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const selectedCashier = cashier.selectedCashier.cashier_number;
    const saleDate = cashier.saleDateFilter;
    const upc = cashier.upcFilter.toLowerCase();
    const desc = cashier.descFilter.toLowerCase();
    const priceTypes = cashier.selectedPriceTypes;
    const totalSales = cashier.totalSalesFilter;
    const threshold = cashier.cashierTableThreshComp;
    const transId = cashier.transIdFilter.toLowerCase();

    if (
      !selectedCashier &&
      !saleDate &&
      !upc &&
      !desc &&
      priceTypes.length === 0 &&
      totalSales === 0 &&
      !threshold.gt &&
      !threshold.lt &&
      !transId
    ) {
      // No filters applied, show all data
      const reducedSaleIds = reduceSaleIds(cashier.transList);
      const reducedPriceTypes = reducePriceTypes(cashier.transList);
      dispatch(setAvailablePriceTypes(reducedPriceTypes));
      dispatch(setCashierSaleIds(reducedSaleIds));
      setFiltered(cashier.transList);
      return;
    }

    const currentFiltered = () => {
      const result = cashier.transList.filter((item) => {
        const matchCashier = selectedCashier
          ? item.cashier_number === selectedCashier
          : true;
        const matchesDate = formatDate(item.sale_date).includes(saleDate);
        const matchesUpc =
          item.product_code !== null
            ? item.product_code.toLowerCase().includes(upc.toLowerCase())
            : true;
        const matchesDesc = item.product_description
          .toLowerCase()
          .includes(desc.toLowerCase());
        const matchesPriceType =
          priceTypes.length > 0 ? priceTypes.includes(item.price_type) : true;
        const matchesTotalSales = () => {
          if (totalSales === 0 || (!threshold.gt && !threshold.lt)) return true;
          if (threshold.gt) {
            return item.total_sales > totalSales;
          } else if (threshold.lt) {
            return item.total_sales < totalSales;
          }
        };

        const saleSplit = item.sale_id.split("-")[1];
        const matchesTransId =
          saleSplit !== null
            ? saleSplit.toLowerCase().includes(transId.toLowerCase())
            : true;

        // Then return all of these filters values
        return (
          matchCashier &&
          matchesDate &&
          matchesUpc &&
          matchesDesc &&
          matchesPriceType &&
          matchesTotalSales() &&
          matchesTransId
        );
      });
      return result;
    };

    // Updating available price types and sale IDs based on the new filtered data
    const newFiltered = currentFiltered();
    const reducedSaleIds = reduceSaleIds(newFiltered);
    const reducedPriceTypes = reducePriceTypes(newFiltered);
    dispatch(setAvailablePriceTypes(reducedPriceTypes));
    dispatch(setCashierSaleIds(reducedSaleIds));
    setFiltered(newFiltered);
  }, [
    cashier.transList,
    cashier.selectedCashier,
    cashier.saleDateFilter,
    cashier.upcFilter,
    cashier.descFilter,
    cashier.selectedPriceTypes,
    cashier.totalSalesFilter,
    cashier.transIdFilter,
  ]);

  const onCellClicked = (e: CellClickedEvent) => {
    const def = e.column.getColDef();
    if (def.headerName === "Trans ID") {
      const saleId = e.value;
      const saleDate = e.data.sale_date.split("T")[0];
      const storeid = e.data.storeid;
      dispatch(setTransactionDrillDown([]));
      dispatch(setTransModalOpen(true));
      getCashierTransaction(
        context.url,
        context.token,
        saleDate,
        saleId,
        storeid,
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setTransactionDrillDown([j.transaction]));
          }
        })
        .catch((err: JsonError) => {
          dispatch(setTransModalOpen(false));
          toast.error("Error fetching transactions: " + err.message);
        });
    }
  };

  const handleShowAll = () => {
    const chunked: TransactionListItem[][] = [];
    let result: TransactionListItem[] = [];
    filtered.forEach((item, i) => {
      // if starting a new chunk or every item shares the same sale_id
      if (
        result.length === 0 ||
        result.every((res) => res.sale_id === item.sale_id)
      ) {
        result.push(item);

        // if at the end, then push the final chunk otherwise, it gets left out
        if (i === filtered.length - 1) {
          chunked.push(result);
        }
      } else {
        // if this new sale_id is different, push the current chunk and start a new one
        chunked.push(result);
        result = [];
        result.push(item);
      }
    });

    dispatch(setTransactionDrillDown(chunked));
    dispatch(setTransModalOpen(true));
  };

  const handlePageChange = (direction?: "prev" | "next") => {
    if (context.isDesktop) {
      const start = formatGoliathDate(search.startDate);
      const end = formatGoliathDate(search.endDate);
      const saleType =
        cashier.selectedSaleType === "Description"
          ? "description"
          : cashier.selectedSaleType;
      let pageToSend;
      if (direction) {
        pageToSend =
          direction === "next"
            ? cashier.currentGridPage + 1
            : cashier.currentGridPage - 1;
        dispatch(setCurrentGridPage(pageToSend));
      } else {
        pageToSend = cashier.currentGridPage;
      }

      dispatch(setPageText(pageToSend.toString()));
      dispatch(setCurrentGridPage(pageToSend));
      dispatch(setFetchingCashierTransactions(true));
      dispatch(setTransList([]));

      getCashierTable(
        context.url,
        context.token,
        start,
        end,
        0,
        cashier.selectedStoreId,
        1,
        [saleType],
        pageToSend,
        cashier.searchString,
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const transactions = [...j.transactions];
            dispatch(setCashierTransactions(transactions));

            const saleIds = Array.from(
              new Set(transactions.map((item) => item.sale_id)),
            );
            dispatch(setSelectedSaleIds(saleIds));
            dispatch(setTransList([]));

            // call the api
            getTransactionList(
              context.url,
              context.token,
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
                  dispatch(setTransList(j.transactions));
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
    }
  };

  const handlePageInput = (x: string) => {
    if (!isNaN(Number(x)) && Number(x) >= 0 && Number(x) <= cashier.gridPages) {
      dispatch(setCurrentGridPage(Number(x)));
      dispatch(setPageText(x));
    }
  };

  return (
    <div
      data-testid="cashiers-table"
      className="bg-custom-white p-2 rounded-lg shadow-lg h-[90%] relative"
    >
      <ExportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={filtered}
        columns={colDefs}
      />
      <div className="h-[91%]">
        <AgGridReact
          rowData={filtered}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
          paginationPageSizeSelector={false}
          onCellClicked={onCellClicked}
        />
      </div>
      <div
        className={`absolute bottom-2.5 left-2 flex gap-2 ${cashier.fetchingCashierTransactions ? "pointer-events-none opacity-50" : ""}`}
      >
        <button
          data-testid="cashiers-table-showall-btn"
          className="btn-themeGreen py-1"
          onClick={handleShowAll}
        >
          Show All
        </button>
        <button
          data-testid="cashiers-table-export-btn"
          className="btn-themeGreen py-1"
          onClick={() => setModalOpen(true)}
        >
          Export
        </button>
      </div>
      <div
        className={`${cashier.gridPages > 1 ? "absolute " : "hidden"} bottom-2.5 right-2 flex items-center gap-2 ${cashier.fetchingCashierTransactions ? "pointer-events-none opacity-50" : ""}`}
      >
        <ChevronLeftIcon
          data-testid="cashiers-prev-page-btn"
          className={`w-6 h-6 border rounded-full text-custom-white bg-blue-500 hover:bg-blue-200 hover:text-content transition-all duration-200 cursor-pointer ${cashier.currentGridPage < 2 ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => handlePageChange("prev")}
        />
        <div className="flex gap-2 justify-center text-sm font-medium">
          <div className="pt-0.5 select-none">Page </div>
          <Input
            label=""
            value={cashier.pageText}
            setValue={handlePageInput}
            className="p-0 text-center rounded-full"
            onKeyDown={handlePageChange}
            width="w-8"
          />
          <div className="pt-0.5 select-none"> of {cashier.gridPages}</div>
        </div>
        <ChevronRightIcon
          data-testid="cashiers-next-page-btn"
          className={`w-6 h-6 border rounded-full text-custom-white bg-blue-500 hover:bg-blue-200 hover:text-content transition-all duration-200 cursor-pointer ${cashier.currentGridPage === cashier.gridPages ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => handlePageChange("next")}
        />
      </div>
    </div>
  );
};

export default CashiersTable;
