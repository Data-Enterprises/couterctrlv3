import { useAppSelector } from "../../../../hooks";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  // type RowClickedEvent,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { theme, costCols } from ".";

const SubDeptCostGrid = () => {
  const sm = useAppSelector((state) => state.subMargin);

  return (
    <div>
      <AgGridReact
        rowData={sm.subDeptCost}
        columnDefs={costCols}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </div>
  );
};

export default SubDeptCostGrid;
