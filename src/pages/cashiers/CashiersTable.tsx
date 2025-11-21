import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { colDefs, theme } from ".";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getCashierTransactions } from "../../api/cashiers";
import {
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

  // const [salesFilter, setSalesFilter] = useState<string>("");
  const [upcFilter, setUpcFilter] = useState<string>("");
  const [descFilter, setDescFilter] = useState<string>("");

  useEffect(() => {
    if (cashier.selectedCashier.cashier_number !== 0) {
      const selectedCashierRows = cashier.transList.filter((item) => {
        return (
          item.cashier_number === cashier.selectedCashier.cashier_number &&
          item.store_number === cashier.selectedCashier.store_number
        );
      });
      setFiltered(selectedCashierRows);
    } else {
      setFiltered(cashier.transList);
    }
  }, [cashier.transList, cashier.selectedCashier]);

  useEffect(() => {
    // If both filters are empty, show all => this prevents unnecessary filtering/iterations
    if (upcFilter.trim() === "" && descFilter.trim() === "") {
      setFiltered(cashier.transList);
    } else {
      // .includes() for  comparing an empty string (from the inputs) to any string with length 
      // will always return true, so no need for extra checks
      const upc = upcFilter.trim();
      const desc = descFilter.trim().toLowerCase();
      const applyFilters = [...cashier.transList].filter((item) => {
        return (
          item.product_code !== null &&
          item.product_code.includes(upc) &&
          item.product_description.toLowerCase().includes(desc)
        );
      });
      setFiltered(applyFilters);
    }
  }, [upcFilter, descFilter]);

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

  // main div container should be 20px taller than the table for now
  return (
    <>
      {filtered.length ? (
        <div className="bg-custom-white mt-3 px-2 pb-2 rounded-lg shadow-lg">
          <div className="">
            <div className="flex items-end gap-2 mb-2">
              <div>
                <button className="btn-themeGreen py-1">Show All</button>
              </div>
              <div>
                <label htmlFor="upc" className="text-xs font-medium">
                  UPC
                </label>
                <input
                  type="text"
                  name="upc"
                  className="basic-input py-1 bg-custom-white focus:border"
                  value={upcFilter}
                  onChange={(e) => setUpcFilter(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="desc" className="text-xs font-medium">
                  Description
                </label>
                <input
                  type="text"
                  name="desc"
                  className="basic-input py-1 bg-custom-white focus:border"
                  value={descFilter}
                  onChange={(e) => setDescFilter(e.target.value)}
                />
              </div>
            </div>
            <div style={{ height: "320px" }}>
              <AgGridReact
                rowData={filtered}
                columnDefs={colDefs}
                theme={theme}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={false}
                onCellClicked={onCellClicked}
              />
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default CashiersTable;
