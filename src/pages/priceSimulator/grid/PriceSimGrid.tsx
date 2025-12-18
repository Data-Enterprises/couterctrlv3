import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { AgGridReact } from "ag-grid-react";
import { theme } from "../../forecast";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import type { SimGridRow } from "../../../interfaces";
import { calcFcstQty } from "../calc";
import { setNewRowPriceValue } from "../../../features/priceSimSlice";

const PriceSimGrid = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.priceSim);
  const [rows, setRows] = useState<SimGridRow[]>([]);

  useEffect(() => {
    if (state.rowData.length > 0) {
      setRows(state.rowData);
    }
  }, [state.rowData]);

  const colDefs: (ColDef<SimGridRow> | ColGroupDef<SimGridRow>)[] = [
    {
      field: "upc",
      headerName: "UPC",
      flex: 1.3,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1.9,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      field: "regular_retail_price",
      headerName: "Regular Price",
      flex: 1.3,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      field: "currentPrice",
      headerName: "Price",
      flex: 1,
      valueFormatter: (param) => param.data!.currentPrice.toFixed(2),
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
      editable: true,
      valueSetter: (params) => {
        const upc = params.data.upc;
        const newPrice = parseFloat(params.newValue);
        if (!isNaN(newPrice)) {
          dispatch(setNewRowPriceValue({ upc, newPrice }));
        }
        return !isNaN(newPrice);
      },
    },
    {
      field: "prices",
      headerName: "Fcst Qty",
      flex: 1,
      valueFormatter: (param) =>
        calcFcstQty(param.data!.prices, param.data!.currentPrice).toString(),
    },
  ];

  return (
    <div className="h-1/2 shadow-lg rounded-lg">
      <AgGridReact
        rowData={rows}
        columnDefs={colDefs}
        theme={theme}
        paginationAutoPageSize={true}
      />
    </div>
  );
};

export default PriceSimGrid;
