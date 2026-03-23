import { useSubMarginCtx } from "../../hooks";
import { useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
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
  const sm = useAppSelector((state) => state.subMargin);

  const handleRowClick = (event: RowClickedEvent) => {
    if (event.data.date !== selectedWeekDay) {
      dispatch(setSelectedWeekDay(event.data.date));
    } else {
      dispatch(setSelectedWeekDay(""));
    }
  };

  useEffect(() => {
    if (gridRef.current && gridRef.current.api && selectedWeekDay) {
      gridRef.current.api.forEachNode((node) => {
        const date = new Date(selectedWeekDay).toISOString().split("T")[0];
        const nodeDate = new Date(node.data.date).toISOString().split("T")[0];
        if (nodeDate === date && !node.isSelected()) {
          node.setSelected(true);
        }
      });
    }
  }, [selectedWeekDay, gridRef.current, sm.itemGridData]);

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
