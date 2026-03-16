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
  // setFetchingCashierTransactions,
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
import ExportModal from "./export/ExportModal";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import Input from "../../components/inputs/Input";
ModuleRegistry.registerModules([AllCommunityModule]);

const CashiersTable = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [filtered, setFiltered] = useState<TransactionListItem[]>([]);
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const cashier = useAppSelector((state) => state.cashier);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [fetchingPage, setFetchingPage] = useState<boolean>(false);
  const [pageText, setPageText] = useState<string>("1");

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
      console.log("howdy");
      const start = formatGoliathDate(search.startDate);
      const end = formatGoliathDate(search.endDate);
      let pageToSend;
      if (direction) {
        pageToSend =
          direction === "next"
            ? cashier.currentGridPage + 1
            : cashier.currentGridPage - 1;
      } else {
        pageToSend = cashier.currentGridPage;
      }

      dispatch(setCurrentGridPage(pageToSend));
      setFetchingPage(true);

      getCashierTable(
        context.url,
        context.token,
        start,
        end,
        0,
        cashier.selectedStoreId,
        1,
        [cashier.selectedSaleType],
        pageToSend,
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const transactions = [...j.transactions];
            dispatch(setCashierTransactions(transactions));

            const uniqueCashiers = transactions.reduce(
              (acc: UniqueCashier[], curr) => {
                const cashier = acc.find(
                  (item) => item.cashier_number === curr.cashier_number,
                );

                if (!cashier) {
                  acc.push({
                    cashier_name: curr.cashier_name,
                    cashier_number: curr.cashier_number,
                    total_sales: curr.total_sales,
                    transaction_count: 1,
                    store_number: curr.store_number,
                  });
                } else {
                  cashier.total_sales += curr.total_sales;
                  cashier.transaction_count += 1;
                }
                return acc;
              },
              [],
            );

            // Everything below is going inside the then block of the cashier_table call
            dispatch(setCashiers(uniqueCashiers));

            const saleIds = Array.from(
              new Set(transactions.map((item) => item.sale_id)),
            );
            dispatch(setSelectedSaleIds(saleIds));
            dispatch(setTransList([]));
            // dispatch(setFetchingCashierTransactions(true));

            // call the api
            getTransactionList(
              context.url,
              context.token,
              saleIds,
              1,
              cashier.selectedSaleType,
            )
              .then((resp) => {
                const j = resp.data;
                if (j.error === 0) {
                  dispatch(setTransList(j.transactions));
                }
              })
              .catch((err: JsonError) =>
                toast.error("Error fetching transactions: " + err.message),
              )
              .finally(() => {
                setFetchingPage(false);
              });
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  };

  const handlePageInput = (x: string) => {
    if (!isNaN(Number(x)) && Number(x) >= 0 && Number(x) <= cashier.gridPages) {
      dispatch(setCurrentGridPage(Number(x)));
      setPageText(x);
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
        {!fetchingPage ? (
          <AgGridReact
            rowData={filtered}
            columnDefs={colDefs}
            theme={theme}
            pagination={true}
            paginationAutoPageSize={true}
            paginationPageSizeSelector={false}
            onCellClicked={onCellClicked}
          />
        ) : (
          <LoadingIndicator />
        )}
      </div>
      <div
        className={`absolute bottom-2.5 left-2 flex gap-2 ${fetchingPage ? "pointer-events-none opacity-50" : ""}`}
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
        className={`${cashier.gridPages > 1 ? "absolute " : "hidden"} bottom-2.5 right-2 grid grid-cols-3 gap-2 ${fetchingPage ? "pointer-events-none opacity-50" : ""}`}
      >
        <button
          data-testid="cashiers-table-showall-btn"
          className={`btn-themeBlue py-1 ${cashier.currentGridPage < 2 ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => handlePageChange("prev")}
        >
          Prev Page
        </button>
        <div className="flex gap-2 items-center justify-center text-sm font-medium">
          <div>Page </div>
          <Input
            label=""
            value={pageText}
            setValue={handlePageInput}
            className="p-0 text-center"
            onKeyDown={handlePageChange}
            width="w-8"
          />
          <div> of {cashier.gridPages}</div>
        </div>
        <button
          data-testid="cashiers-table-export-btn"
          className={`btn-themeBlue py-1 ${cashier.currentGridPage === cashier.gridPages ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => handlePageChange("next")}
        >
          Next Page
        </button>
      </div>
    </div>
  );
};

export default CashiersTable;
