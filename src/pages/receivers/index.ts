import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { ReceiverListItem } from "../../interfaces";
import { formatDate } from "../../utils";

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
  selectedRowBackgroundColor: "#93c5fd",
});

export const cols: (
  | ColDef<ReceiverListItem>
  | ColGroupDef<ReceiverListItem>
)[] = [
  {
    headerName: "Date",
    field: "invoice_date",
    resizable: false,
    flex: 0.5,
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
    flex: 0.5,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Trans",
    field: "invoiceid",
    resizable: false,
    flex: 0.5,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Name",
    field: "vendor_name",
    resizable: false,
    flex: 1,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Invoice #",
    field: "reference_number",
    resizable: false,
    flex: 0.5,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Items",
    field: "items",
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    flex: 0.5,
    cellClass: "no-outline-on-focus",
  },
];
