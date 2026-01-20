import { themeQuartz } from "ag-grid-community";
import type { ColDef, ColGroupDef } from "ag-grid-community";
import { formatCurrency2 } from "../../../utils";

export type UpcRow = {
  product_code: string;
  product_description: string;
  price: number;
  total_qty: number;
  total_revenue: number;
  total_weight: number;
};

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

export const colDefs: (ColDef<UpcRow> | ColGroupDef<UpcRow>)[] = [
  {
    headerName: "Upc",
    field: "product_code",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Description",
    field: "product_description",
    flex: 2,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Best Price",
    field: "price",
    flex: 1,
    resizable: false,
    cellStyle: { textAlign: "right" },
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => `$${params.value}`,
    cellClass: "no-outline-on-focus select-none",
  },
  {
    headerName: "Qty",
    field: "total_qty",
    flex: 0.8,
    resizable: false,
    cellStyle: { textAlign: "right" },
    valueFormatter: (params) => params.value.toLocaleString(),
    cellClass: "no-outline-on-focus select-none",
  },
];

export const priceColDefs: (ColDef<UpcRow> | ColGroupDef<UpcRow>)[] = [
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