import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  theme,
  formatDate,
  chunkSales,
  reduceTransactions,
} from ".";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getCashierTransaction } from "../../api/lossPrevention";
import { useLPState } from "./hooks/useLPState";
import { useLPActions } from "./hooks/useLPActions";
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
import { formatBigNumber, formatCurrency2 } from "../../utils";
ModuleRegistry.registerModules([AllCommunityModule]);

import ExportModal from "./export/ExportModal";

const CashiersTable = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [filtered, setFiltered] = useState<TransactionListItem[]>([]);
  const [filteredOverviews, setFilteredOverviews] = useState<
    TransactionOverview[]
  >([]);
  const context = useAppSelector((state) => state.app);
  const cashier = useLPState();
  const actions = useLPActions();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const selectedCashier = cashier.selectedCashier.cashier_number;
    const saleDate = cashier.saleDateFilter;
    const transId = cashier.transIdFilter.toLowerCase();
    const sales = cashier.salesThreshold;
    const qty = cashier.qtyThreshold;

    if (!selectedCashier && !saleDate && !transId && !sales && !qty) {
      setFiltered(cashier.transList);
      setFilteredOverviews(cashier.transOverviews);
      return;
    }

    const newFilteredTransactions = cashier.transOverviews.filter((item) => {
      const matchCashier = selectedCashier ? item.cashier_number === selectedCashier : true;
      const matchesDate = formatDate(item.sale_date).includes(saleDate);
      const matchesTransId = item.transaction_id !== null
        ? item.transaction_id.toLowerCase().includes(transId)
        : true;
      const matchesSales = sales
        ? sales.op === "gt" ? item.total_sales > sales.amount
        : sales.op === "lt" ? item.total_sales < sales.amount
        : item.total_sales === sales.amount
        : true;
      const matchesQty = qty
        ? qty.op === "gt" ? (item.qty ?? 0) > qty.amount
        : qty.op === "lt" ? (item.qty ?? 0) < qty.amount
        : (item.qty ?? 0) === qty.amount
        : true;
      return matchCashier && matchesDate && matchesTransId && matchesSales && matchesQty;
    });

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
    cashier.salesThreshold,
    cashier.transIdFilter,
    cashier.qtyThreshold,
  ]);

  const onCellClicked = (e: CellClickedEvent) => {
    const def = e.column.getColDef();
    if (def.headerName === "Transaction ID") {
      const saleId = e.data.sale_id;
      const saleDate = e.data.sale_date.split("T")[0];
      const storeid = e.data.storeid;
      dispatch(actions.setTransactionDrillDown([]));
      dispatch(actions.setTransModalOpen(true));
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
            dispatch(actions.setTransactionDrillDown([reducedTransactions]));
          }
        })
        .catch((err: JsonError) => {
          dispatch(actions.setTransModalOpen(false));
          toast.error("Error fetching transactions: " + err.message);
        });
    }
  };

  const handleShowAll = () => {
    const chunked: TransactionListItem[][] = chunkSales(filtered);
    dispatch(actions.setTransactionDrillDown(chunked));
    dispatch(actions.setTransModalOpen(true));
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
    </div>
  );
};

export default CashiersTable;
