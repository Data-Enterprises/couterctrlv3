import { themeQuartz, type ColDef } from "ag-grid-community";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import type { SubDeptCost } from "../../../../interfaces";

export interface BarData {
  sales: number;
  net: number;
  qty: number;
  tax: number;
  cogs: number;
  date: string;
  gpm: string;
}

export interface ItemRow {
  sub_department_description: string; // good
  product_code: string; // good
  product_description: string; // good
  cogs: number; // good
  total_sales: number; // good
  net_sales: number; // good
  total_tax: number; // good
  qty: number; //good
  margin: number;
  cost_fees: number;
}

export const formatDate = (dateStr: string) => {
  const split = dateStr.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

export const cols: ColDef<BarData>[] = [
  {
    flex: 1.1,
    field: "date",
    headerName: "Date",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      const dow = new Date(params.value).toDateString().split(" ")[0];
      return `${dow}, ${params.value}`;
    }
  },
  {
    flex: 0.9,
    field: "sales",
    headerName: "Sales",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.9,
    field: "net",
    headerName: "Net Sales",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.7,
    field: "qty",
    headerName: "Qty",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatBigNumber(params.value, 0),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.7,
    field: "tax",
    headerName: "Tax",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.9,
    field: "cogs",
    headerName: "COGS",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.7,
    field: "gpm",
    headerName: "GPM",
    resizable: false,
    cellClass: "no-outline-on-focus text-right",
  },
];

export const itemCols: ColDef<ItemRow>[] = [
  {
    flex: 1.1,
    field: "product_code",
    headerName: "Upc",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    flex: 1.9,
    field: "product_description",
    headerName: "Description",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    flex: 0.9,
    field: "total_sales",
    headerName: "Sales",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.9,
    field: "net_sales",
    headerName: "Net Sales",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.7,
    field: "qty",
    headerName: "Qty",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatBigNumber(params.value, 0),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.7,
    field: "total_tax",
    headerName: "Tax",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.8,
    field: "cogs",
    headerName: "COGS",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 1,
    field: "cost_fees",
    headerName: "Cost Fees",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => `${params.value.toFixed(2)}%`,
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.8,
    field: "margin",
    headerName: "GPM",
    resizable: false,
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => `${params.value.toFixed(2)}%`,
  },
];

export const costCols: ColDef<SubDeptCost>[] = [
  {
    flex: 1,
    field: "product_code",
    headerName: "Upc",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 2.3,
    field: "description",
    headerName: "Description",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    flex: 0.7,
    field: "calculated_cost",
    headerName: "Unit Cost",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.7,
    field: "cost",
    headerName: "Case Cost",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.7,
    field: "qty",
    headerName: "Qty",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatBigNumber(params.value, 0),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 0.8,
    field: "total_cost",
    headerName: "COGS",
    resizable: false,
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
];

export const theme = themeQuartz.withParams({
  headerHeight: 26,
  rowHeight: 26,
  headerBackgroundColor: "#3b82f6",
  headerTextColor: "#ffffff",
  oddRowBackgroundColor: "#dbeafe",
  rowHoverColor: "#93c5fd",
  headerFontWeight: "bold",
  dataFontSize: 13,
  headerFontSize: 14,
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
  selectedRowBackgroundColor: "#fed7aa",
});
