import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { AgGridReact } from "ag-grid-react";
import { theme } from ".";
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
import { getPriceHistory } from "../../api/forecast";
import type { JsonError } from "../../interfaces";
import { setPriceHistory } from "../../features/forecastSlice";
ModuleRegistry.registerModules([AllCommunityModule]);

interface TableData {
  outliers: number;
  upc: string;
  forecastQty: number;
  daysActive: number;
  forecast: number;
}
const colDefs: (ColDef<TableData> | ColGroupDef<TableData>)[] = [
  {
    headerName: "Outliers",
    field: "outliers",
    flex: 1,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus underline font-medium",
  },
  {
    headerName: "UPC",
    field: "upc",
    flex: 1,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Forecast Qty",
    field: "forecastQty",
    flex: 1,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
  },
  {
    headerName: "Days Active",
    field: "daysActive",
    flex: 0.9,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
  },
  {
    headerName: "Forecast",
    field: "forecast",
    flex: 0.8,
    cellClass: "no-outline-on-focus text-right",
  },
];

const OutlierGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const state = useAppSelector((state) => state.forecast);
  const search = useAppSelector((state) => state.search);
  const [tableData, setTableData] = useState<TableData[]>([]);

  useEffect(() => {
    if (state.selectedUpcs.length > 0) {
      const upcs = state.selectedUpcs;
      const data = state.qty
        .filter((item) => upcs.includes(item.upc))
        .map((item) => ({
          outliers: item.metrics.outliers.length,
          upc: item.upc,
          forecastQty: item.metrics.qty,
          daysActive: item.metrics.days_active,
          forecast: item.forecast,
        }));
      setTableData(data);
    } else {
      setTableData([]);
    }
  }, [state.selectedUpcs]);

  const onRowClicked = (e: RowClickedEvent<TableData>) => {
    if (e.data) {
      const upc = e.data.upc;
      const forecast = e.data.forecast;

      getPriceHistory(
        context.url,
        context.token,
        state.storeids,
        search.endDate,
        upc,
        forecast
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setPriceHistory(j.result));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  };

  return (
    <div
      className={`${
        tableData.length > 0 ? "animate-windowIn h-[100%] flex gap-4" : "hidden"
      }`}
    >
      <div className="h-[100%] w-1/2 shadow-lg">
        <AgGridReact
          rowData={tableData}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
          onRowClicked={onRowClicked}
        />
      </div>
      <div className="h-[100%] w-1/2 opacity-0 shadow-lg">
        {/* <AgGridReact
          rowData={tableData}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
        /> */}
      </div>
    </div>
  );
};

export default OutlierGrid;
