import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import type { UpcSalesComp } from "../../../../interfaces";

import { theme, compCols } from "../../components";
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellContextMenuEvent,
  type RowClickedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { setSelectedSalesComps } from "../../../../features/upcSlice";
import { setClipboardText, setMenuPosition } from "../../../../features/ctxMenuSlice";
ModuleRegistry.registerModules([AllCommunityModule]);

const SalesCompGrid = () => {
  const dispatch = useAppDispatch();
  const [upcs, setUpcs] = useState<UpcSalesComp[]>([]);
  const { salesComp, selectedUpcs } = useAppSelector((state) => state.upc);

  useEffect(() => {
    const selected = salesComp.filter((item) =>
      selectedUpcs.includes(item.product_code)
    );
    setUpcs(selected);
  }, [salesComp, selectedUpcs]);

  const handleRowClick = (event: RowClickedEvent<UpcSalesComp>) => {
    // Handle row click if needed
    console.log("Row clicked:", event.data);
    dispatch(setSelectedSalesComps(event.data as UpcSalesComp));
  };

  const handleRightClick = (e: CellContextMenuEvent<UpcSalesComp>) => {
    const mouseEvent = e.event as MouseEvent;
    if (!e.data) return;
    dispatch(
      setClipboardText({ upc: e.data.product_code, desc: e.data.description })
    );
    dispatch(setMenuPosition({ x: mouseEvent.pageX + 5, y: mouseEvent.pageY }));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      <div
        className="ag-theme-alpine h-full w-full"
        onContextMenuCapture={(e) => e.preventDefault()}
      >
        {upcs.length > 0 ? (
          <AgGridReact
            rowData={upcs}
            columnDefs={compCols}
            animateRows={true}
            rowSelection="single"
            theme={theme}
            pagination={true}
            paginationAutoPageSize={true}
            onRowClicked={handleRowClick}
            onCellContextMenu={handleRightClick}
          />
        ) : (
          <div className="text-content/70 flex flex-col justify-center items-center h-full">
            <div>Select one or more UPCs</div>
            <div>To view the individual weekday sales</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesCompGrid;
