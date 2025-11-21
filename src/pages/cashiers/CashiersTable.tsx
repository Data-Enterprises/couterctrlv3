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
ModuleRegistry.registerModules([AllCommunityModule]);

const CashiersTable = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [filtered, setFiltered] = useState<TransactionListItem[]>([]);
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.cashier);

  // Filtering the transaction list based on the selected cashier
  // useEffect(() => {
  //   if (cashier.selectedCashier.cashier_number !== 0) {
  //     // Table is filtered by selected cashier here => this will need to be refactored to take into account all filters
  //     const selectedCashierRows = cashier.transList.filter((item) => {
  //       return (
  //         item.cashier_number === cashier.selectedCashier.cashier_number &&
  //         item.store_number === cashier.selectedCashier.store_number
  //       );
  //     });

  //     const reducedSaleIds = reduceSaleIds(selectedCashierRows);
  //     const reducedPriceTypes = reducePriceTypes(selectedCashierRows);
  //     dispatch(setAvailablePriceTypes(reducedPriceTypes));
  //     dispatch(setCashierSaleIds(reducedPriceTypes));
  //     dispatch(setCashierSaleIds(reducedSaleIds));
  //     setFiltered(selectedCashierRows);
  //   } else {
  //     // Table is unfiltered here
  //     const reducedSaleIds = reduceSaleIds(cashier.transList);
  //     const reducedPriceTypes = reducePriceTypes(cashier.transList);
  //     dispatch(setAvailablePriceTypes(reducedPriceTypes));
  //     dispatch(setCashierSaleIds(reducedSaleIds));
  //     setFiltered(cashier.transList);
  //   }
  // }, [cashier.transList, cashier.selectedCashier]);

  useEffect(() => {
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

      const result = cashier.transList.filter((item) => {
        const matchCashier = selectedCashier
          ? item.cashier_number === selectedCashier
          : true;
        const matchesDate = formatDate(item.sale_date).includes(saleDate);
        const matchesUpc = item.product_code !== null ? item.product_code.toLowerCase().includes(upc) : true;
        const matchesDesc = item.product_description
          .toLowerCase()
          .includes(desc);
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
    // console.log(currentFiltered(), "Filtered Result");
    setFiltered(currentFiltered());
  }, [
    cashier.transList,
    cashier.selectedCashier,
    cashier.saleDateFilter,
    cashier.upcFilter,
    cashier.descFilter,
    cashier.totalSalesFilter,
    cashier.selectedPriceTypes,
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
        <div className="bg-custom-white p-2 rounded-lg shadow-lg h-full">
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
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default CashiersTable;
