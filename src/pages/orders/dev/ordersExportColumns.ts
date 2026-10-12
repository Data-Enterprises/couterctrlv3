import type { AllOrder } from "../../../interfaces";

/**
 * The columns an order-line export can carry.
 *
 * Lifted out of `ordersCols`, which is an ag-grid definition — flex widths,
 * cell classes, header borders — none of which a CSV has any use for. Same
 * fields and same names, so a column means here what it means on the grid.
 */
export type OrderExportColumn = {
  field: keyof AllOrder;
  headerName: string;
};

export const ORDER_EXPORT_COLUMNS: OrderExportColumn[] = [
  { field: "order_id", headerName: "Order ID" },
  { field: "order_type", headerName: "Type" },
  { field: "line_number", headerName: "Line #" },
  { field: "product_code", headerName: "UPC" },
  { field: "description", headerName: "Desc" },
  { field: "sub_department_description", headerName: "Dept Description" },
  { field: "sub_department", headerName: "Dept" },
  { field: "storename", headerName: "Store" },
  { field: "storenumber", headerName: "Store #" },
  { field: "weight", headerName: "Weight" },
  { field: "active_retail_price", headerName: "Retail" },
  { field: "base_cost", headerName: "Cost" },
  { field: "qty", headerName: "Qty" },
  { field: "e_ret", headerName: "Ext Retail" },
  { field: "cogs", headerName: "Total Cost" },
  { field: "rev", headerName: "Profit" },
  { field: "status", headerName: "Status" },
  { field: "tpr", headerName: "TPR" },
  { field: "active_price", headerName: "Active Price" },
  { field: "active_qty", headerName: "Active Qty" },
  { field: "extended_plessy", headerName: "Ext Plessy" },
  { field: "net_cost", headerName: "Net Cost" },
  { field: "active_retail_price", headerName: "Active Retail Price" },
  { field: "active_retail_qty", headerName: "Active Retail Qty" },
  { field: "base_cost", headerName: "Base Cost" },
  { field: "category", headerName: "Category" },
  { field: "category_description", headerName: "Category Description" },
  { field: "vendor_id", headerName: "Vendor ID" },
  { field: "vendor_name", headerName: "Vendor Name" },
  { field: "retail_price", headerName: "Retail Price" },
  { field: "casesize", headerName: "Case Size" },
  { field: "edited", headerName: "Edited" },
  { field: "scalable", headerName: "Scalable" },
];
