import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { TransactionListItem, TransactionOverview } from "../../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../../utils";

export const formatDate = (date: string) => {
  const split = date.split("T")[0].split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

export const cols: (ColDef<TransactionOverview> | ColGroupDef<TransactionOverview>)[] =
  [
    {
      headerName: "Trans ID",
      field: "transaction_id",
      flex: 0.5,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus underline font-medium cursor-pointer",
    },
    {
      headerName: "Date",
      field: "sale_date",
      flex: 0.5,
      hide: false,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
      valueFormatter: (params) => formatDate(params.value),
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
      headerName: "Qty",
      field: "qty",
      flex: 0.4,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      valueFormatter: (params) => formatBigNumber(params.value, 0),
      cellClass: "no-outline-on-focus text-right",
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

export const colDefs: (
  | ColDef<TransactionListItem>
  | ColGroupDef<TransactionListItem>
)[] = [
  {
    headerName: "Trans ID",
    field: "transaction_id",
    flex: 0.5,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus underline font-medium cursor-pointer",
  },
  {
    headerName: "Sale Date",
    field: "sale_date",
    flex: 0.5,
    hide: true,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
    valueFormatter: (params) => formatDate(params.value),
  },
  {
    headerName: "Register",
    field: "terminal",
    flex: 0.5,
    hide: true,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Sale ID",
    field: "sale_id",
    flex: 1,
    hide: true,
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
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
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
    headerName: "Qty",
    field: "qty",
    flex: 0.4,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatBigNumber(params.value, 0),
    cellClass: "no-outline-on-focus text-right",
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
