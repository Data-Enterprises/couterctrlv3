import { useAppSelector, useAppDispatch } from "../../hooks";

import { AgGridReact } from "ag-grid-react";
import { cashierColDefs, theme } from ".";
import type { RowClickedEvent } from "ag-grid-community";
import { setSelectedCashier } from "../../features/cashierSlice";

const UniqueCashiersTable = () => {
  const dispatch = useAppDispatch();
  const { cashiers, selectedCashier } = useAppSelector(
    (state) => state.cashier
  );

  const onRowClicked = (e: RowClickedEvent) => {
    const cashNum = e.data.cashier_number;
    const storeNum = e.data.store_number;
    if (
      cashNum === selectedCashier.cashier_number &&
      storeNum === selectedCashier.store_number
    ) {
      dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
      return;
    }
    dispatch(
      setSelectedCashier({ cashier_number: cashNum, store_number: storeNum })
    );
  };

  return (
    <>
      {cashiers.length ? (
        <div className="bg-custom-white mt-4 px-4 py-2.5 rounded-lg shadow-lg">
          <div style={{ height: "350px" }}>
            <AgGridReact
              rowData={cashiers}
              columnDefs={cashierColDefs}
              theme={theme}
              pagination={true}
              paginationPageSize={10}
              paginationPageSizeSelector={false}
              onRowClicked={onRowClicked}
            />
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default UniqueCashiersTable;
