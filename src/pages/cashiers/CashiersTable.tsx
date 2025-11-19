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
import type { JsonError } from "../../interfaces";

const CashiersTable = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const filteredTableData = useAppSelector(
    (state) => state.cashier.filteredTableData
  );

  const onCellClicked = (e: CellClickedEvent) => {
    const col = e.column.getColId();
    if (col === "sale_id") {
      const saleId = e.value;
      const saleDate = e.data.sale_date.split("T")[0];
      const storeid = e.data.storeid;
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
        .catch((err: JsonError) =>
          toast.error("Error fetching transactions: " + err.message)
        )
        .finally(() => dispatch(setTransModalOpen(true)));
    }
  };
  return (
    <div className="w-full">
      <div style={{ height: 400 }}>
        <AgGridReact
          rowData={filteredTableData}
          columnDefs={colDefs}
          theme={theme}
          // onRowClicked={(e: RowClickedEvent) => {
          //   console.log("Row clicked:", e.data);
          // }}
          onCellClicked={onCellClicked}
        />
      </div>
    </div>
  );
};

export default CashiersTable;
