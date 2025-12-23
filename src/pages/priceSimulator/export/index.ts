import type { ColDef, ColGroupDef } from "ag-grid-community";
import type { SimGridRow } from "../../../interfaces";

export const exportHeaders: (ColDef<SimGridRow> | ColGroupDef<SimGridRow>)[] = [
  {
    field: "upc",
    headerName: "UPC",
  },
  {
    field: "description",
    headerName: "Description",
  },
  {
    field: "fcstPrice",
    headerName: "Fcast Price",
  },
  {
    field: "fcstQty",
    headerName: "Fcast Qty",
  },
  {
    field: "fcstDollars",
    headerName: "Fcast $",
    flex: 0.9,
  },
  {
    field: "regRetail",
    headerName: "Reg Retail",
    flex: 0.9,
  },
  {
    field: "regQty",
    headerName: "Reg Qty",
  },
  {
    field: "regDollars",
    headerName: "Regular $",
  },
  {
    field: "markdownDollars",
    headerName: "Markdown $",
  },
  {
    field: "lift",
    headerName: "Lift",
  },
];
