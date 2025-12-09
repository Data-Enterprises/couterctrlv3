import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
// import { useToast } from "../../components/toasts/hooks/useToast";
import { AgGridReact } from "ag-grid-react";
import { theme } from ".";
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import { formatCurrency2 } from "../../utils";
import { setCurrentLift } from "../../features/forecastSlice";

interface TableData {
  upc: string;
  desc: string;
  type: string;
  activePrice: number;
  qty: number;
  lift: number;
  retailPrice: number
}
const colDefs: (ColDef<TableData> | ColGroupDef<TableData>)[] = [
  {
    headerName: "UPC",
    field: "upc",
    flex: 0.8,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus underline font-medium",
  },
  {
    headerName: "Description",
    field: "desc",
    flex: 1.4,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Type",
    field: "type",
    flex: 0.6,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Active Price",
    field: "activePrice",
    flex: 0.9,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatCurrency2(params.value),
  },
  {
    headerName: "Retail Price",
    field: "retailPrice",
    flex: 0.9,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatCurrency2(params.value),
  },
  {
    headerName: "Qty",
    field: "qty",
    flex: 0.5,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
  },
  {
    headerName: "Multiplier",
    field: "lift",
    flex: 0.7,
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => params.value.toFixed(2),
  },
];

const PriceHistoryGrid = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.forecast);
  const [tableData, setTableData] = useState<TableData[]>([]);

  useEffect(() => {
    if (state.selectedUpcs.length > 0) {
      const data = state.priceHistory.map((item) => ({
        upc: item.product_code,
        desc: item.product_description,
        type: item.price_type,
        activePrice: item.unit_price,
        retailPrice: item.regular_retail_price,
        qty: item.total_qty,
        lift: item.lift,
      }));
      setTableData(data);
    } else {
      setTableData([]);
    }
  }, [state.priceHistory]);

  const onRowClicked = (event: RowClickedEvent<TableData>) => {
    if (event.data) {
      dispatch(setCurrentLift(event.data));
    } 
  };

  return (
    <div
      className={`${
        tableData.length > 0 ? "animate-windowIn h-[100%] flex gap-4" : "hidden"
      }`}
    >
      <div className="h-[100%] w-3/4 shadow-lg">
        <AgGridReact
          rowData={tableData}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
          onRowClicked={onRowClicked}
        />
      </div>
      <div className="h-[100%] w-1/4 opacity-0 shadow-lg"></div>
    </div>
  );
};

export default PriceHistoryGrid;
