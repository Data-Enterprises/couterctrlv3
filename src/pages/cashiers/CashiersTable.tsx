import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { colDefs, theme } from ".";
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
ModuleRegistry.registerModules([AllCommunityModule]);

const CashiersTable = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [filtered, setFiltered] = useState<TransactionListItem[]>([]);
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.cashier);

  // Grabbing the unique sale ids from the current state of the transaction list
  const reduceSaleIds = (data: TransactionListItem[]) => {
    return [...data].reduce((acc: string[], item) => {
      if (!acc.includes(item.sale_id)) {
        acc.push(item.sale_id);
      }
      return acc;
    }, []);
  };

  // Grabbing the unique price types from the current state of the transaction list
  const reducePriceTypes = (data: TransactionListItem[]) => {
    return [...data].reduce((acc: string[], item) => {
      if (!acc.includes(item.price_type)) {
        acc.push(item.price_type);
      }
      return acc;
    }, []);
  };

  // Filtering the transaction list based on the selected cashier
  useEffect(() => {
    if (cashier.selectedCashier.cashier_number !== 0) {

      // Table is filtered by selected cashier here => this will need to be refactored to take into account all filters
      const selectedCashierRows = cashier.transList.filter((item) => {
        return (
          item.cashier_number === cashier.selectedCashier.cashier_number &&
          item.store_number === cashier.selectedCashier.store_number
        );
      });

      const reducedSaleIds = reduceSaleIds(selectedCashierRows);
      const reducedPriceTypes = reducePriceTypes(selectedCashierRows);
      dispatch(setAvailablePriceTypes(reducedPriceTypes));
      dispatch(setCashierSaleIds(reducedPriceTypes));
      dispatch(setCashierSaleIds(reducedSaleIds));
      setFiltered(selectedCashierRows);
    } else {

      // Table is unfiltered here
      const reducedSaleIds = reduceSaleIds(cashier.transList);
      const reducedPriceTypes = reducePriceTypes(cashier.transList);
      dispatch(setAvailablePriceTypes(reducedPriceTypes));
      dispatch(setCashierSaleIds(reducedSaleIds));
      setFiltered(cashier.transList);
    }
  }, [cashier.transList, cashier.selectedCashier]);

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
