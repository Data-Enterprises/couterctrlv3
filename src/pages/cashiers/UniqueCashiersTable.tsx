import { useAppSelector } from "../../hooks";

import { AgGridReact } from "ag-grid-react";
import { cashierColDefs, theme } from ".";

const UniqueCashiersTable = () => {
  const { cashiers } = useAppSelector((state) => state.cashier);

  return (
    <div className="bg-custom-white mt-4 px-4 py-2.5 rounded-lg shadow-lg">
        <AgGridReact
          rowData={cashiers}
          columnDefs={cashierColDefs}
          theme={theme}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={false}
          domLayout="autoHeight"
        />
    </div>
  );
};

export default UniqueCashiersTable;
