import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setCashierSaleIds,
  setSelectedCashier,
} from "../../features/cashierSlice";

import { AgGridReact } from "ag-grid-react";
import { cashierColDefs, filterData, theme } from ".";
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

const UniqueCashiersTable = () => {
  const dispatch = useAppDispatch();
  const { cashiers, selectedCashier, selectedSaleType, cashierTransactions } =
    useAppSelector((state) => state.cashier);

  const onRowClicked = (e: RowClickedEvent) => {
    const cashier_number = e.data.cashier_number;
    const store_number = e.data.store_number;

    if (
      cashier_number === selectedCashier.cashier_number &&
      store_number === selectedCashier.store_number
    ) {
      dispatch(setCashierSaleIds([]));
      dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
      return;
    }
    const filtered = filterData(
      cashierTransactions,
      selectedSaleType,
      store_number
    );

    const saleIds = filtered
      .filter((row) => row.cashier_number === cashier_number)
      .map((item) => item.sale_id);
    dispatch(setCashierSaleIds(saleIds));
    dispatch(setSelectedCashier({ cashier_number, store_number }));
  };

  return (
    <>
      {cashiers.length ? (
        <div className="bg-custom-white p-2 rounded-lg shadow-lg">
          <div style={{ height: "225px" }}>
            <AgGridReact
              rowData={cashiers}
              columnDefs={cashierColDefs}
              theme={theme}
              pagination={true}
              paginationPageSize={6}
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
