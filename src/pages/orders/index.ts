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
    headerName: "Type",
    field: "order_type",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
    hide: true,
  },
  {
    headerName: "Line #",
    field: "line_number",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
    // hide: true,
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
    field: "active_retail_price",
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
    valueFormatter: (params) => {
      if (params.data) {
        const caseSize = params.data.casesize;
        const scalable = params.data.scalable;

        if (scalable > 0 && params.data.weight > 0) {
          return formatCurrency2(params.value / caseSize);
        }
        return formatCurrency2(params.value);
      }
      return "";  
    },
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
    // headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      if (params.data) {
        const qty = params.data.qty;
        const weight = params.data.weight;
        const active_retail_price = params.data.active_retail_price;
        if (weight > 0) {
          return formatCurrency2(active_retail_price * weight);
        }
        return formatCurrency2(qty * active_retail_price);
      }
      return "";
    },
  },
  {
    headerName: "Status",
    field: "status",
    hide: true,
  },
  {
    headerName: "TPR",
    field: "tpr",
    hide: true,
  },
  {
    headerName: "Active Price",
    field: "active_price",
    hide: true,
  },
  {
    headerName: "Active Qty",
    field: "active_qty",
    hide: true,
  },
  {
    headerName: "Ext Plessy",
    field: "extended_plessy",
    hide: true,
  },
  {
    headerName: "Net Cost",
    field: "net_cost",
    hide: true,
  },
  {
    headerName: "Active Retail Price",
    field: "active_retail_price",
    hide: true,
  },
  {
    headerName: "Active Retail Qty",
    field: "active_retail_qty",
    hide: true,
  },
  {
    headerName: "Base Cost",
    field: "base_cost",
    hide: true,
  },
  {
    headerName: "Category",
    field: "category",
    hide: true,
  },
  {
    headerName: "Category Description",
    field: "category_description",
    hide: true,
  },
  {
    headerName: "Vendor ID",
    field: "vendor_id",
    hide: true,
  },
  {
    headerName: "Vendor Name",
    field: "vendor_name",
    hide: true,
  },
  {
    headerName: "Retail Price",
    field: "retail_price",
    hide: true,
  },
  {
    headerName: "Case Size",
    field: "casesize",
    hide: true,
  },
  {
    headerName: "Edited",
    field: "edited",
    hide: true,
  },
  {
    headerName: "Scalable",
    field: "scalable",
    hide: true,
  },
];
