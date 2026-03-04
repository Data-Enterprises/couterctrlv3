import { useSubMarginCtx } from "../../hooks";
import { useCallback, useRef, useEffect } from "react";
import { useAppDispatch } from "../../../../hooks";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { type BarData, cols, theme } from ".";
import { setSelectedWeekDay } from "../../../../features/subMarginSlice";

interface SalesGridProps {
  gridData: BarData[];
}

const SalesGrid = ({ gridData }: SalesGridProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const { selectedWeekDay } = useSubMarginCtx();
  const dispatch = useAppDispatch();

  const handleRowClick = useCallback(
    (event: RowClickedEvent) => {
      dispatch(setSelectedWeekDay(event.data.date));
    },
    [dispatch],
  );

  useEffect(() => {
    if (gridRef.current && gridRef.current.api && selectedWeekDay) {
      gridRef.current.api.forEachNode((node) => {
        const date = new Date(selectedWeekDay).toISOString().split("T")[0];
        const nodeDate = new Date(node.data.date).toISOString().split("T")[0];
        if (nodeDate === date) {
          node.setSelected(true);
        }
      });
    }
  }, [selectedWeekDay, gridRef.current]);

  return (
    <div className="rounded-lg shadow-lg">
      <div className="h-full">
        <AgGridReact
          ref={gridRef}
          rowData={gridData}
          columnDefs={cols}
          theme={theme}
          onRowClicked={handleRowClick}
          rowSelection={"single"}
        />
      </div>
    </div>
  );
};

export default SalesGrid;
