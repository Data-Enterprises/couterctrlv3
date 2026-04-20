import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { AllOrder } from "../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../utils";

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

/**
 *   {
     headerName: "Total Sales",
     field: "total_sales",
     flex: 0.6,
     resizable: false,
     valueFormatter: (params) => formatCurrency2(params.value),
     cellClass: "no-outline-on-focus text-right",
   },
 */

export const ordersCols: (ColDef<AllOrder> | ColGroupDef<AllOrder>)[] = [
  {
    headerName: "Order",
    field: "order_id",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Seq",
    field: "line_number",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
    hide: true,
  },
  {
    headerName: "UPC",
    field: "product_code",
    flex: 1.1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Desc",
    field: "description",
    flex: 2.4,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Dept",
    field: "sub_department",
    flex: 0.7,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Store",
    field: "storename",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Store #",
    field: "storenumber",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Weight",
    field: "weight",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatBigNumber(params.value, 2),
  },
  {
    headerName: "Retail",
    field: "retail_price",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatCurrency2(params.value),
  },
  {
    headerName: "Cost",
    field: "base_cost",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatCurrency2(params.value),
  },
  {
    headerName: "Qty",
    field: "qty",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatBigNumber(params.value, 0),
  },
  {
    headerName: "ERet",
    field: "qty",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      if (params.data) {
        const qty = params.data.qty;
        const active_retail_price = params.data.active_retail_price;
        return formatCurrency2(qty * active_retail_price);
      }
      return "";
    },
  },
];
