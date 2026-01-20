import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { priceColDefs, theme } from "../charts";
import type { UpcPriceOpt } from "../../../interfaces";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

const UpcPrices = () => {
  const state = useAppSelector((state) => state.upc);
  const [rows, setRows] = useState<UpcPriceOpt[]>([]);

  useEffect(() => {
    const filtered = state.optBestPrices.filter((item) =>
      state.selectedUpcs.includes(item.product_code)
    );
    setRows(filtered);
  }, [state.selectedUpcs]);

  return (
    <div className="bg-custom-white shadow-lg rounded-lg min-h-[100%] max-h-[100%] select-none relative">
      {state.selectedUpcs.length === 0 ? (
        <div className="h-full p-10 flex flex-col items-center text-content/50 text-sm text-center font-medium gap-2">
          <div>Select one or more UPCs to view the Prices by UPC</div>
          <div>
            This mode displays optimal prices by comparing each selected item's
            historical pricing, quantity, and revenue data
          </div>
        </div>
      ) : (
        <div className="h-full">
            <AgGridReact
              rowData={rows}
              columnDefs={priceColDefs}
              theme={theme}
              headerHeight={30}
              pagination={true}
              paginationAutoPageSize={true}
              animateRows={true}
              enableCellTextSelection={true}
            />
        </div>
      )}
    </div>
  );
};

export default UpcPrices;
