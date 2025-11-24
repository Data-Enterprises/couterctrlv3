import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { colDefs, theme, reducePriceTypes, reduceSaleIds } from ".";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getCashierTransactions } from "../../api/cashiers";
import {
  setAvailablePriceTypes,
  setCashierSaleIds,
  setCashierTransDrillDown,
  setTransModalOpen,
} from "../../features/cashierSlice";
import type { JsonError, TransactionListItem } from "../../interfaces";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClickedEvent,
} from "ag-grid-community";
import { formatDate } from "../../utils";
import ExportModal from "./export/ExportModal";
ModuleRegistry.registerModules([AllCommunityModule]);

const CashiersTable = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [filtered, setFiltered] = useState<TransactionListItem[]>([]);
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.cashier);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (cashier.transList.length === 0) {
      setFiltered([]);
    }
    // Applying all filters to the transaction list
    const selectedCashier = cashier.selectedCashier.cashier_number;
    const saleDate = cashier.saleDateFilter;
    const upc = cashier.upcFilter.toLowerCase();
    const desc = cashier.descFilter.toLowerCase();
    const priceTypes = cashier.selectedPriceTypes;
    const totalSales = cashier.totalSalesFilter;
    const threshold = cashier.cashierTableThreshComp;

    if (
      !selectedCashier &&
      !saleDate &&
      !upc &&
      !desc &&
      priceTypes.length === 0 &&
      totalSales === 0 &&
      !threshold.gt &&
      !threshold.lt
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
      const selectedCashier = cashier.selectedCashier.cashier_number;
      const saleDate = cashier.saleDateFilter;
      const upc = cashier.upcFilter.toLowerCase();
      const desc = cashier.descFilter.toLowerCase();
      const priceTypes = cashier.selectedPriceTypes;
      const totalSales = cashier.totalSalesFilter;
      const threshold = cashier.cashierTableThreshComp;

      // Switch the default trues to false if we decide to see a strict comparison!!!!!!!!!
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
          if (totalSales === 0) return true;
          if (threshold.gt) {
            return item.total_sales > totalSales;
          } else if (threshold.lt) {
            return item.total_sales < totalSales;
          }
        };
        // Then return all of these filters values
        return (
          matchCashier &&
          matchesDate &&
          matchesUpc &&
          matchesDesc &&
          matchesPriceType &&
          matchesTotalSales()
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
  ]);

  const onCellClicked = (e: CellClickedEvent) => {
    const col = e.column.getColId();
    if (col === "sale_id") {
      const saleId = e.value;
      const saleDate = e.data.sale_date.split("T")[0];
      const storeid = e.data.storeid;
      dispatch(setCashierTransDrillDown([]));
      dispatch(setTransModalOpen(true));
      getCashierTransactions(
        context.url,
        context.token,
        saleDate,
        saleId,
        storeid
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setCashierTransDrillDown(j.transaction));
          }
        })
        .catch((err: JsonError) => {
          dispatch(setTransModalOpen(false));
          toast.error("Error fetching transactions: " + err.message);
        });
    }
  };

  return (
    <>
      {filtered.length ? (
        <div className="bg-custom-white p-2 rounded-lg shadow-lg h-full relative">
          <ExportModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            data={filtered}
            columns={colDefs}
          />
          <div className="h-full">
            <AgGridReact
              rowData={filtered}
              columnDefs={colDefs}
              theme={theme}
              pagination={true}
              paginationPageSize={21}
              paginationPageSizeSelector={false}
              onCellClicked={onCellClicked}
            />
          </div>
          <div className="absolute bottom-4 left-6">
            <button className="btn-themeGreen py-1">Show All</button>
            <button
              className="btn-themeGreen py-1 ml-4"
              onClick={() => setModalOpen(true)}
            >
              Export
            </button>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default CashiersTable;
