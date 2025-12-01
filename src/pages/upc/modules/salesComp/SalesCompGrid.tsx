import { useState, useEffect } from "react";
import { useAppSelector } from "../../../../hooks";
import type { UpcSalesComp } from "../../../../interfaces";

import { theme, compCols } from "../../components";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
ModuleRegistry.registerModules([AllCommunityModule]);

const SalesCompGrid = () => {
  const [upcs, setUpcs] = useState<UpcSalesComp[]>([]);
  const { salesComp, selectedUpcs } = useAppSelector((state) => state.upc);

  useEffect(() => {
    const selected = salesComp.filter((item) => selectedUpcs.includes(item.product_code));
    setUpcs(selected);
  }, [salesComp, selectedUpcs]);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      <div className="ag-theme-alpine h-full w-full">
        <AgGridReact
          rowData={upcs}
          columnDefs={compCols}
          defaultColDef={{ sortable: true, filter: false, resizable: false }}
          animateRows={true}
          rowSelection="single"
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
        />
      </div>
    </div>
  );
};

export default SalesCompGrid;
