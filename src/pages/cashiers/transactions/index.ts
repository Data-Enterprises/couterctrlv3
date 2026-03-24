import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { TransactionListItem } from "../../../interfaces";
import { formatCurrency2, formatDate } from "../../../utils";

export const colDefs: (
  | ColDef<TransactionListItem>
  | ColGroupDef<TransactionListItem>
)[] = [
  {
    headerName: "Trans ID",
    field: "sale_id",
    flex: 0.5,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => params.value.split("-")[1],
    cellClass: "no-outline-on-focus underline font-medium cursor-pointer",
  },
  {
    headerName: "Sale ID",
    field: "sale_id",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Type",
    field: "sale_type",
    flex: 0.5,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Price Type",
    field: "price_type",
    flex: 0.5,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Date",
    field: "sale_date",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
    valueFormatter: (params) => formatDate(params.value),
  },
  {
    headerName: "Store",
    field: "store_number",
    flex: 0.4,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Cashier",
    field: "cashier_name",
    flex: 0.5,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Cashier ID",
    field: "cashier_number",
    flex: 0.5,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Upc",
    field: "product_code",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Description",
    field: "product_description",
    flex: 1.3,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Total Sales",
    field: "total_sales",
    flex: 0.6,
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
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
  selectedRowBackgroundColor: "#fed7aa",
});