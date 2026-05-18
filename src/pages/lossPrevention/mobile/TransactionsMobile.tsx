import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatDate, chunkSales, reduceTransactions } from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getCashierTransaction } from "../../../api/lossPrevention";
import {
  setTransactionDrillDown,
  setTransModalOpen,
} from "../../../features/lossPreventionSlice";
import type {
  JsonError,
  TransactionListItem,
  TransactionOverview,
} from "../../../interfaces";

import {
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

import ExportModal from "../export/ExportModal";

const TransactionsMobile = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [filtered, setFiltered] = useState<TransactionListItem[]>([]);
  const [filteredOverviews, setFilteredOverviews] = useState<
    TransactionOverview[]
  >([]);
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.lossPrevention);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  // const [page, setPage] = useState<number>(1);

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

  const handleTransIDClick = (e: TransactionOverview) => {
    const saleId = e.sale_id;
    const saleDate = e.sale_date.split("T")[0];
    const storeid = e.storeid;
    dispatch(setTransactionDrillDown([]));
    dispatch(setTransModalOpen(true));
    getCashierTransaction(context.url, context.token, saleDate, saleId, storeid)
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
  };

  const handleShowAll = () => {
    const chunked: TransactionListItem[][] = chunkSales(filtered);
    dispatch(setTransactionDrillDown(chunked));
    dispatch(setTransModalOpen(true));
  };

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

  // const processPageRows = () => {
  //   const
  // };

  return (
    <div
      data-testid="cashiers-table"
      className="bg-custom-white m-2 rounded-lg shadow-lg h-[90%] relative"
    >
      <ExportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={filtered}
        columns={colDefs}
      />

      <div className="">
        <div className="bg-bkg sticky top-0 z-10 divide-x divide-content/20 rounded-t-lg shadow-sm">
          <div className="grid grid-cols-[1fr_repeat(2,1.2fr)_0.6fr_repeat(3,0.8fr)] font-medium text-[11.5px] px-3 py-1">
            <div className="font-medium">Trans ID</div>
            <div>Date</div>
            <div>Type</div>
            <div className="text-right pr-1.5">Store</div>
            <div>Cashier</div>
            {/* <div className="text-right">Cashier #</div> */}
            <div className="text-right">Qty</div>
            <div className="text-right">Sales</div>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-content/10 max-h-[calc(100vh-23.5rem)] overflow-y-auto">
          {filteredOverviews.map((fo, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_repeat(2,1.2fr)_0.6fr_repeat(3,0.8fr)] px-3 py-1 text-[10px] last:rounded-b-lg"
              onClick={() => handleTransIDClick(fo)}
            >
              <div className="font-medium underline cursor-pointer truncate pr-2">
                {fo.transaction_id}
              </div>
              <div className="truncate">{formatDate(fo.sale_date)}</div>
              <div className="truncate">{fo.sale_type}</div>
              <div className="truncate text-right pr-1.5">
                {fo.store_number}
              </div>
              <div className="truncate">{fo.cashier_name}</div>
              {/* <div className="truncate text-right">{fo.cashier_number}</div> */}
              <div className="text-right font-medium">
                {formatBigNumber(fo.qty, 0)}
              </div>
              <div className="text-right font-medium">
                {formatCurrency2(fo.total_sales)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex px-2 pb-2 gap-2 md:gap-3 pointer-events-none md:pointer-events-auto">
        <button
          data-testid="cashiers-table-showall-btn"
          className="btn-themeGreen py-1 px-3 flex-1 text-[13px] pointer-events-auto"
          onClick={handleShowAll}
        >
          Show All
        </button>
        <button
          data-testid="cashiers-table-export-btn"
          className="btn-themeGreen py-1 px-3 flex-1 text-[13px] pointer-events-auto"
          onClick={() => setModalOpen(true)}
        >
          Export
        </button>
      </div>
    </div>
  );
};

export default TransactionsMobile;
