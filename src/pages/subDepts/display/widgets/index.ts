import { themeQuartz, type ColDef } from "ag-grid-community";
import { formatCurrency2, formatBigNumber } from "../../../../utils";

export interface BarData {
  sales: number;
  net: number;
  qty: number;
  tax: number;
  cogs: number;
  date: string;
  gpm: string;
}

export const formatDate = (dateStr: string) => {
  const split = dateStr.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

export const cols: ColDef<BarData>[] = [
  {
    flex: 0.8,
    field: "date",
    headerName: "Date",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 1,
    field: "sales",
    headerName: "Sales",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    flex: 1,
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
    flex: 1,
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

export const theme = themeQuartz.withParams({
  headerHeight: 27,
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