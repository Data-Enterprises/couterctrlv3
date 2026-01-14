import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { ReceiverDetailsItem, ReceiverListItem } from "../../interfaces";
import { formatBigNumber, formatDate } from "../../utils";

export const theme = themeQuartz.withParams({
  headerHeight: 27,
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

export const cols: (
  | ColDef<ReceiverListItem>
  | ColGroupDef<ReceiverListItem>
)[] = [
  {
    headerName: "Date",
    field: "invoice_date",
    resizable: false,
    flex: 0.6,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
    valueFormatter: (params) => {
      return formatDate(params.value);
    },
  },
  {
    headerName: "Store",
    field: "store_number",
    resizable: false,
    flex: 0.4,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Trans",
    field: "invoiceid",
    resizable: false,
    flex: 0.4,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Vendor ID",
    field: "vendorid",
    resizable: false,
    flex: 0.6,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Name",
    field: "vendor_name",
    resizable: false,
    flex: 0.9,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Invoice #",
    field: "reference_number",
    resizable: false,
    flex: 0.6,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Items",
    field: "items",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    flex: 0.4,
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Operator",
    field: "cashier_name",
    resizable: false,
    flex: 0.7,
    // headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  }
];

const defaultOptions = {
  headerClass: "border-content/50 border-b-2",
  cellClass: "no-outline-on-focus",
  resizable: false,
};

// line_number, product_code, cases, product_description, cases, units, U Cost, Ext Cost, Retail, Ext Retail, gross margin, Free, Return
export const detailCols: (
  | ColDef<ReceiverDetailsItem>
  | ColGroupDef<ReceiverDetailsItem>
)[] = [
  {
    headerName: "Line",
    field: "line_number",
    flex: 0.4,
    ...defaultOptions,
  },
  {
    headerName: "UPC",
    field: "product_code",
    flex: 0.8,
    ...defaultOptions,
  },
  {
    headerName: "Description",
    field: "product_description",
    flex: 1.5,
    ...defaultOptions,
  },
  {
    headerName: "Cases",
    field: "cases",
    flex: 0.5,
    ...defaultOptions,
    aggFunc: "sum",
  },
  {
    headerName: "Units",
    field: "units",
    flex: 0.5,
    ...defaultOptions,
    aggFunc: "sum",
  },
  {
    headerName: "U Cost",
    field: "ucost",
    flex: 0.5,
    ...defaultOptions,
    aggFunc: "sum",
  },
  {
    headerName: "Ext Cost",
    field: "ext_cost",
    flex: 0.5,
    ...defaultOptions,
    aggFunc: "sum",
  },
  {
    headerName: "Retail",
    field: "retail",
    flex: 0.5,
    ...defaultOptions,
  },
  {
    headerName: "Ext Retail",
    field: "ext_retail",
    flex: 0.5,
    ...defaultOptions,
    aggFunc: "sum",
  },
  {
    headerName: "GM",
    field: "gm",
    flex: 0.5,
    ...defaultOptions,
    valueFormatter: (params) =>
      parseFloat(formatBigNumber(params.value, 2)).toFixed(2) + "%",
  },
  {
    headerName: "Free",
    field: "free",
    flex: 0.5,
    ...defaultOptions,
  },
  {
    headerName: "Return",
    field: "return",
    flex: 0.5,
    ...defaultOptions,
  },
];
