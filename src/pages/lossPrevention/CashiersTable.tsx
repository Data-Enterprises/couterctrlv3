import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  theme,
  formatDate,
  chunkSales,
  reduceCashiers,
  reduceTransactions,
} from ".";
import { useToast } from "../../components/toasts/hooks/useToast";
import {
  getCashierTable,
  getCashierTransaction,
  getTransactionList,
} from "../../api/lossPrevention";
import {
  setCashiers,
  setCashierTransactions,
  setCurrentGridPage,
  setFetchingCashierTransactions,
  setPageText,
  setSelectedSaleIds,
  setTransactionDrillDown,
  setTransList,
  setTransModalOpen,
  setTransOverviews,
} from "../../features/lossPreventionSlice";
import type {
  JsonError,
  TransactionListItem,
  TransactionOverview,
} from "../../interfaces";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClickedEvent,
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
import {
  formatBigNumber,
  formatCurrency2,
  formatGoliathDate,
} from "../../utils";
ModuleRegistry.registerModules([AllCommunityModule]);

import ExportModal from "./export/ExportModal";
import Input from "../../components/inputs/Input";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

const CashiersTable = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [filtered, setFiltered] = useState<TransactionListItem[]>([]);
  const [filteredOverviews, setFilteredOverviews] = useState<
    TransactionOverview[]
  >([]);
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const cashier = useAppSelector((state) => state.lossPrevention);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const selectedCashier = cashier.selectedCashier.cashier_number;
    const saleDate = cashier.saleDateFilter;
    const totalSales = cashier.totalSalesFilter;
    const threshold = cashier.cashierTableThreshComp;
    const transId = cashier.transIdFilter.toLowerCase();
    const qtyThreshold = cashier.cashierTableQtyThreshComp;
    const totalQty = cashier.totalQtyFilter;

    if (
      !selectedCashier &&
      !saleDate &&
      totalSales === 0 &&
      !threshold.gt &&
      !threshold.lt &&
      !transId &&
      !qtyThreshold.gt &&
      !qtyThreshold.lt &&
      totalQty === 0
    ) {
      // No filters applied, show all data
      setFiltered(cashier.transList);
      setFilteredOverviews(cashier.transOverviews);
      return;
    }

    const currentFiltered = () => {
      const result = cashier.transOverviews.filter((item) => {
        const matchCashier = selectedCashier
          ? item.cashier_number === selectedCashier
          : true;
        const matchesDate = formatDate(item.sale_date).includes(saleDate);
        const matchesTotalSales = () => {
          if (threshold.gt) {
            return item.total_sales > totalSales;
          } else if (threshold.lt) {
            return item.total_sales < totalSales;
          } else {
            return true;
          }
        };

        const matchesTotalQty = () => {
          if (qtyThreshold.gt) {
            return item.qty! > totalQty;
          } else if (qtyThreshold.lt) {
            return item.qty! < totalQty;
          } else {
            return true;
          }
        };

        const matchesTransId =
          item.transaction_id !== null
            ? item.transaction_id.toLowerCase().includes(transId.toLowerCase())
            : true;

        // Then return all of these filters values
        return (
          matchCashier &&
          matchesDate &&
          matchesTotalSales() &&
          matchesTotalQty() &&
          matchesTransId
        );
      });
      return result;
    };

    // Updating available price types and sale IDs based on the new filtered data
    const newFilteredTransactions = currentFiltered();

    const transIds = newFilteredTransactions.map((item) => item.transaction_id);
    const newFilteredItems = [...cashier.transList].filter((item) =>
      transIds.includes(item.transaction_id),
    );
    setFiltered(newFilteredItems as TransactionListItem[]);
    setFilteredOverviews(newFilteredTransactions as TransactionOverview[]);
  }, [
    cashier.transList,
    cashier.selectedCashier,
    cashier.saleDateFilter,
    cashier.totalSalesFilter,
    cashier.transIdFilter,
    cashier.totalQtyFilter,
  ]);

  const onCellClicked = (e: CellClickedEvent) => {
    const def = e.column.getColDef();
    if (def.headerName === "Transaction ID") {
      const saleId = e.data.sale_id;
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
            const transactions: TransactionListItem[] = [...j.transaction].map(
              (item) => ({
                ...item,
                transaction_id: item.sale_id.split("-")[1],
                qty: item.qty ? item.qty : 0,
              }),
            );
            const reducedTransactions: TransactionListItem[] =
              reduceTransactions(transactions);
            dispatch(setTransactionDrillDown([reducedTransactions]));
          }
        })
        .catch((err: JsonError) => {
          dispatch(setTransModalOpen(false));
          toast.error("Error fetching transactions: " + err.message);
        });
    }
  };

  const handleShowAll = () => {
    const chunked: TransactionListItem[][] = chunkSales(filtered);
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
                  const uniqueCashiers = reduceCashiers(newTrans);

                  // Everything below is going inside the then block of the cashier_table call
                  dispatch(setCashiers(uniqueCashiers));
                  const formatted = newTrans.map((item) => {
                    const transactionId = item.sale_id.split("-")[1];
                    return { ...item, transaction_id: transactionId };
                  });
                  const overviews: TransactionOverview[] = [
                    ...formatted,
                  ].reduce(
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
    }
  };

  const handlePageInput = (x: string) => {
    if (!isNaN(Number(x)) && Number(x) >= 0 && Number(x) <= cashier.gridPages) {
      dispatch(setCurrentGridPage(Number(x)));
      dispatch(setPageText(x));
    }
  };

  const overviewCols: (
    | ColDef<TransactionOverview>
    | ColGroupDef<TransactionOverview>
  )[] = [
    {
      headerName: "Transaction ID",
      field: "transaction_id",
      resizable: false,
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus underline font-medium cursor-pointer",
    },
    {
      headerName: "Date",
      field: "sale_date",
      resizable: false,
      flex: 1,
      valueFormatter: (params) => formatDate(params.value),
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Sale Type",
      field: "sale_type",
      resizable: false,
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Store Number",
      field: "store_number",
      resizable: false,
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Cashier Name",
      field: "cashier_name",
      resizable: false,
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Cashier Number",
      field: "cashier_number",
      resizable: false,
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Qty",
      field: "qty",
      resizable: false,
      flex: 0.7,
      headerStyle: { borderRight: "1px solid white" },
      valueFormatter: (params) => formatBigNumber(params.value, 0),
      cellClass: "no-outline-on-focus text-right",
    },
    {
      headerName: "Total Sales",
      field: "total_sales",
      resizable: false,
      flex: 0.7,
      headerStyle: { borderRight: "1px solid white" },
      valueFormatter: (params) => formatCurrency2(params.value),
      cellClass: "no-outline-on-focus text-right",
    },
  ];

  const colDefs: (
    | ColDef<TransactionListItem>
    | ColGroupDef<TransactionListItem>
  )[] = [
    {
      headerName: "Trans ID",
      field: "transaction_id",
      flex: 0.5,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus underline font-medium cursor-pointer",
    },
    {
      headerName: "Sale Date",
      field: "sale_date",
      flex: 0.5,
      hide: true,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Register",
      field: "terminal",
      flex: 0.5,
      hide: true,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Sale ID",
      field: "sale_id",
      flex: 1,
      hide: true,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Type",
      field: "sale_type",
      flex: 0.5,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Price Type",
      field: "price_type",
      flex: 0.6,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Date",
      field: "sale_date",
      flex: 0.5,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Store",
      field: "store_number",
      flex: 0.4,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Cashier",
      field: "cashier_name",
      flex: 0.5,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Cashier ID",
      field: "cashier_number",
      flex: 0.5,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Upc",
      field: "product_code",
      flex: 0.6,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Description",
      field: "product_description",
      flex: 1.3,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Qty",
      field: "qty",
      flex: 0.4,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      headerName: "Total Sales",
      field: "total_sales",
      flex: 0.6,
      resizable: false,
      cellClass: "no-outline-on-focus text-right",
    },
  ];

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
          rowData={filteredOverviews}
          columnDefs={overviewCols}
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
          className={`w-6 h-6 border rounded-full text-custom-white bg-blue-500 hover:bg-blue-200 hover:text-content transition-all duration-200 cursor-pointer ${cashier.currentGridPage < 2 ? "opacity-50 pointer-events-none" : ""}`}
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
          className={`w-6 h-6 border rounded-full text-custom-white bg-blue-500 hover:bg-blue-200 hover:text-content transition-all duration-200 cursor-pointer ${cashier.currentGridPage === cashier.gridPages ? "opacity-50 pointer-events-none" : ""}`}
          onClick={() => handlePageChange("next")}
        />
      </div>
    </div>
  );
};

export default CashiersTable;
