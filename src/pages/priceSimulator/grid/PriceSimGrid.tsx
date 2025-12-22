import { useEffect } from "react";
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
import {
  setGlobalRows,
  setNewRowPriceValue,
  // setRowData,
} from "../../../features/priceSimSlice";
import { formatCurrency2 } from "../../../utils";
import CalcModal from "../calc/CalcModal";
import CalcNowCheckbox from "./CheckBoxCell";

const PriceSimGrid = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.priceSim);

  useEffect(() => {
    if (state.globalFcstPrice !== "") {
      const newPrice = parseFloat(state.globalFcstPrice);
      if (!isNaN(newPrice)) {
        const updatedRows = state.rowData.map((row) => {
          // Recalculate forecast qty based on new price
          if (row.prices.length < 2) return row; // Need at least 2 price points to calculate forecast qty

          // if more than two data points, we can calculate a forecast qty
          const fcstQty = calcFcstQty(row.prices, newPrice);
          const fcstDollars = newPrice * fcstQty;
          const markdownDollars = (row.regRetail - newPrice) * fcstQty;
          const lift = row.regQty > 0 ? (fcstQty - row.regQty) / row.regQty : 0;
          return {
            ...row,
            fcstPrice: newPrice,
            fcstQty: fcstQty,
            fcstDollars: fcstDollars,
            markdownDollars: markdownDollars,
            lift: lift,
          };
        });

        dispatch(setGlobalRows(updatedRows));
      }
    }
  }, [state.globalFcstPrice]);

  const colDefs: (ColDef<SimGridRow> | ColGroupDef<SimGridRow>)[] = [
    {
      field: "calcNow",
      headerName: "Calculate",
      flex: 0.8,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus flex justify-center items-center",
      cellRenderer: CalcNowCheckbox, // Use the custom component
      cellRendererSelector: undefined, // Ensure it always uses your renderer
    },
    {
      field: "upc",
      headerName: "UPC",
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      field: "fcstPrice",
      headerName: "Fcast Price",
      flex: 1,
      valueFormatter: (params) => formatCurrency2(params.value),
      editable: true,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
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
      field: "fcstQty",
      headerName: "Fcast Qty",
      flex: 0.9,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "fcstDollars",
      headerName: "Fcast $",
      flex: 0.9,
      valueFormatter: (params) => formatCurrency2(params.value),
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "regRetail",
      headerName: "Reg Retail",
      flex: 0.9,
      valueFormatter: (params) => formatCurrency2(params.value),
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "regQty",
      headerName: "Reg Qty",
      flex: 0.8,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "regDollars",
      headerName: "Regular $",
      flex: 0.9,
      valueFormatter: (params) => formatCurrency2(params.value),
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "markdownDollars",
      headerName: "Markdown $",
      flex: 1,
      valueFormatter: (params) => formatCurrency2(params.value),
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "lift",
      headerName: "Lift",
      flex: 0.7,
      valueFormatter: (params) => params.value.toFixed(2) || 0,
      cellClass: "no-outline-on-focus text-right",
    },
  ];

  if (state.rowData.length === 0) return null;

  const renderRows = () => {
    if (state.globalRows.length) {
      return state.globalRows;
    }
    const filtered = state.rowData.filter((row) =>
      state.selectedUpcs.includes(row.upc)
    );
    return filtered;
  };

  return (
    <div className="h-full shadow-lg rounded-lg">
      <CalcModal />
      <AgGridReact
        rowData={renderRows()}
        columnDefs={colDefs}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </div>
  );
};

export default PriceSimGrid;
