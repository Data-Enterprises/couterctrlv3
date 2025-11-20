import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { AgGridReact } from "ag-grid-react";
import { colDefs, theme } from ".";
import type { CellClickedEvent } from "ag-grid-community";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getCashierTransactions } from "../../api/cashiers";
import {
  setCashierTransDrillDown,
  setTransModalOpen,
} from "../../features/cashierSlice";
import type { JsonError, TransactionListItem } from "../../interfaces";

const CashiersTable = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [filtered, setFiltered] = useState<TransactionListItem[]>([]);
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.cashier);

  // const [salesFilter, setSalesFilter] = useState<string>("");
  // const [cashierFilter, setCashierFilter] = useState<string>("");
  // const [upcFilter, setUpcFilter] = useState<string>("");

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

  // useEffect(() => {
  //   if (salesFilter === "" && cashierFilter === "" && upcFilter === "") {
  //     setFiltered(cashier.filteredTableData);
  //     return;
  //   }
  //   const filteredResult = filtered.filter((item) => {
  //     const upc = item.product_code !== null ? item.product_code : "";
  //     const cashierName = item.cashier_name !== null ? item.cashier_name : "";

  //     return (
  //       upc.toLowerCase().includes(upcFilter.toLowerCase()) &&
  //       cashierName.toLowerCase().includes(cashierFilter.toLowerCase())
  //     );
  //   });

  //   setFiltered(filteredResult);
  // }, [salesFilter, cashierFilter, upcFilter]);

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

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   if (name === "sales") {
  //     setSalesFilter(value);
  //   } else if (name === "cashier") {
  //     setCashierFilter(value);
  //   } else if (name === "upc") {
  //     setUpcFilter(value);
  //   }
  // };

  // main div container should be 20px taller than the table for now
  return (
    <>
      {filtered.length ? (
        <div className="bg-custom-white mt-3 p-2 rounded-lg shadow-lg">
          {/* <div className="bg-custom-white mt-2 px-4 py-2.5 rounded-lg shadow-lg h-[300px]"> */}
          <div className="">
            {/* <div className="flex gap-4 mb-4 items-end">
            <div>
              <button className="btn-themeBlue">Show All</button>
            </div>
            <div className="w-1/12">
              <label htmlFor="sales" className="text-xs font-medium">
                Sales
              </label>
              <input
                name="sales"
                type="text"
                value={salesFilter}
                onChange={handleChange}
                className="basic-input focus:border bg-custom-white cursor-default"
              />
            </div>
            <div className="w-1/6">
              <label htmlFor="cashier" className="text-xs font-medium">
                Cashier
              </label>
              <input
                name="cashier"
                type="text"
                value={cashierFilter}
                onChange={handleChange}
                className="basic-input focus:border bg-custom-white cursor-default"
              />
            </div>
            <div className="w-1/6">
              <label htmlFor="upc" className="text-xs font-medium">
                Upc
              </label>
              <input
                name="upc"
                type="text"
                value={upcFilter}
                onChange={handleChange}
                className="basic-input focus:border bg-custom-white cursor-default"
              />
            </div>
          </div> */}
            <div style={{ height: "310px" }}>
              <AgGridReact
                rowData={filtered}
                columnDefs={colDefs}
                theme={theme}
                pagination={true}
                paginationPageSize={9}
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
