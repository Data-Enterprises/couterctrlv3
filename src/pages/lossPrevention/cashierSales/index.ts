import { themeQuartz, type ColDef } from "ag-grid-community";
import type { CashierDetails } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

export const theme = themeQuartz.withParams({
  headerHeight: 30,
  rowHeight: 26.5,
  headerBackgroundColor: "#3b82f6",
  headerTextColor: "#ffffff",
  oddRowBackgroundColor: "#bfdbfe",
  rowHoverColor: "#93c5fd",
  headerFontWeight: "bold",
  dataFontSize: 13,
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
  // selectedRowBackgroundColor: "#93c5fd",
  selectedRowBackgroundColor: "#fed7aa",
});

export const cashierDetailCols: ColDef<CashierDetails>[] = [
  {
    headerName: "Store",
    field: "store_number",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Trans",
    field: "transaction_count",
    flex: 0.7,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
  },
  {
    headerName: "Total Qty",
    field: "total_items",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatBigNumber(params.value, 0),
  },
  {
    headerName: "Total Dollars",
    field: "amount",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatCurrency2(params.value),
  },
  {
    headerName: "Avg Dollars",
    field: "average_dollars",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatCurrency2(params.value),
  },
  {
    headerName: "Avg Qty",
    field: "average_qty",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatBigNumber(params.value, 2),
  },
  {
    headerName: "Cashiers",
    field: "cashier_count",
    flex: 0.8,
    resizable: false,
    // headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatBigNumber(params.value, 0),
  },
];
