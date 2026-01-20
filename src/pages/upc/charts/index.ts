import { themeQuartz } from "ag-grid-community";
import type { ColDef, ColGroupDef } from "ag-grid-community";
import { formatCurrency2 } from "../../../utils";
import type { UpcPriceOpt } from "../../../interfaces";

export const theme = themeQuartz.withParams({
  headerHeight: 40,
  rowHeight: 25.5,
  headerBackgroundColor: "#3b82f6",
  headerTextColor: "#ffffff",
  oddRowBackgroundColor: "#bfdbfe",
  rowHoverColor: "#93c5fd",
  headerFontWeight: "bold",
  dataFontSize: 13,
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
  selectedRowBackgroundColor: "#fed7aa",
});

export const priceColDefs: (ColDef<UpcPriceOpt> | ColGroupDef<UpcPriceOpt>)[] = [
  {
    headerName: "Upc",
    field: "product_code",
    flex: 0.9,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Description",
    field: "product_description",
    flex: 1.9,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Price",
    field: "price",
    flex: 0.8,
    resizable: false,
    cellStyle: { textAlign: "right" },
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus select-none",
  },
  {
    headerName: "Qty",
    field: "total_qty",
    flex: 0.7,
    resizable: false,
    cellStyle: { textAlign: "right" },
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus select-none",
  },
  {
    headerName: "Revenue",
    field: "total_revenue",
    flex: 0.9,
    resizable: false,
    cellStyle: { textAlign: "right" },
    cellClass: "no-outline-on-focus select-none",
    valueFormatter: (params) => formatCurrency2(params.value),
  },
];