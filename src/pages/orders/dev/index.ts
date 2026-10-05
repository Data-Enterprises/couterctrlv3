import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type { AllOrder } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

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

export const getCogs = (
  base_cost: number,
  qty: number,
  scalable: number,
  weight: number,
  casesize: number,
) => {
  // const { base_cost, qty, scalable, weight, casesize } = data;

  // Prevents NaN and infinites
  if (!base_cost) {
    return 0;
  }

  // A case of none is not a case. base_cost is a case cost in every branch
  // below, so an item carrying casesize 0 is treated as a case of one —
  // dividing by the zero the data actually holds returned Infinity, and one
  // row of it was enough to put a whole column's total through as N/A.
  const perCase = casesize > 0 ? casesize : 1;

  // For weighted items
  if (scalable > 0) {
    const unitCost = base_cost / perCase;
    if (!weight || weight === 0) {
      return unitCost * qty;
    }
    return unitCost * weight;
  }

  // For non-weighted items.
  //
  // The qty cancels: this branch has always returned base_cost, and it was
  // written as a division so it returned NaN when qty was 0. Left as it was
  // rather than "fixed" into base_cost * qty — that is a different cost for
  // every cased-by-one line in the app, and not a change to make while
  // chasing a crash.
  if (casesize === 1) {
    return base_cost;
  }

  // case size > 1, or the 0 the guard above rewrote to 1
  const unitCost = base_cost / perCase;
  return unitCost * qty;
};

export const getERet = (
  qty: number,
  weight: number,
  active_retail_price: number,
  scalable: number,
) => {
  // const { qty, weight, active_retail_price, scalable } = data;

  if (scalable > 0) {
    if (!weight || weight === 0) {
      return active_retail_price * qty;
    }
    return active_retail_price * weight;
  }

  return active_retail_price * qty;
};

export const ordersCols: (ColDef<AllOrder> | ColGroupDef<AllOrder>)[] = [
  {
    headerName: "Order ID",
    field: "order_id",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Type",
    field: "order_type",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
    // hide: true,
  },
  {
    headerName: "Line #",
    field: "line_number",
    flex: 0.8,
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
    flex: 2.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Dept Description",
    field: "sub_department_description",
    hide: true,
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
    flex: 0.7,
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
      if (!params.data) return "";

      const caseSize = params.data.casesize;
      const cost = params.value;
      // if (caseSize === 0 || cost === 0) {
      //   return "N/A";
      // }
      if (cost === 0 || caseSize === 0) return "$0.00";
      // if (cost > 0 && caseSize > 0) {
      //   console.log(cost, caseSize);
      // }

      return formatCurrency2(cost / caseSize);
    },
  },
  {
    headerName: "Qty",
    field: "qty",
    flex: 0.7,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatBigNumber(params.value, 0),
  },
  {
    headerName: "Ext Retail",
    field: "e_ret",
    flex: 0.8,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatCurrency2(params.value),
  },
  {
    headerName: "Total Cost",
    field: "cogs",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatCurrency2(params.value),
  },
  {
    headerName: "Profit",
    field: "rev",
    flex: 0.8,
    resizable: false,
    // headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => formatCurrency2(params.value),
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
