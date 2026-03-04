import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  // type RowClickedEvent,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { type BarData, cols, theme } from ".";

interface SalesGridProps {
  gridData: BarData[];
}

const SalesGrid = ({ gridData }: SalesGridProps) => {
  return (
    <div className="rounded-lg shadow-lg">
      <div className="h-full">
        <AgGridReact rowData={gridData} columnDefs={cols} theme={theme} />
      </div>
    </div>
  );
};

export default SalesGrid;
