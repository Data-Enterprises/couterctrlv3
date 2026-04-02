import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setCashierSaleIds,
  setSelectedCashier,
} from "../../features/lossPreventionSlice";

import { AgGridReact } from "ag-grid-react";
import { cashierColDefs, theme } from ".";
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

const UniqueCashiersTable = () => {
  const dispatch = useAppDispatch();
  const { cashiers, selectedCashier, fetchingCashierTransactions } =
    useAppSelector((state) => state.lossPrevention);

  const onRowClicked = (e: RowClickedEvent) => {
    const cashier_number = e.data.cashier_number;
    const store_number = e.data.store_number;

    if (
      cashier_number === selectedCashier.cashier_number &&
      store_number === selectedCashier.store_number
    ) {
      dispatch(setCashierSaleIds([]));
      dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
      e.api.deselectAll();
      return;
    }
    dispatch(setSelectedCashier({ cashier_number, store_number }));
  };

  return (
    <>
      {cashiers.length && !fetchingCashierTransactions ? (
        <div
          data-testid="unique-cashiers-table"
          className="rounded-lg shadow-lg h-[85%]"
        >
          <div className="h-full">
            <AgGridReact
              rowData={cashiers}
              columnDefs={cashierColDefs}
              theme={theme}
              pagination={cashiers.length > 5}
              paginationAutoPageSize={cashiers.length > 5}
              paginationPageSizeSelector={false}
              onRowClicked={onRowClicked}
              rowSelection="single"
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
