import BarChart from "./BarChart";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { theme } from "../components";
import { useAppSelector } from "../../../hooks";
import { salesPanelCols } from ".";

const WeeklySalesReport = () => {
  const { salesPanels } = useAppSelector((state) => state.sales);

  return (
    <div className="py-4 grid grid-rows-[1.05fr_0.95fr_1fr] gap-4 h-[70vh]">
      <div className="grid grid-cols-2 gap-4">
        <BarChart inReport={true} />
      </div>
      <div className="rounded-lg border border-content/50">
        <AgGridReact
          rowData={salesPanels}
          columnDefs={salesPanelCols}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default WeeklySalesReport;
