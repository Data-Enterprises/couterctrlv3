import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type {
  TransactionListItem,
  TransactionOverview,
  UniqueCashier,
} from "../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../utils";

export const formatDate = (dateStr: string) => {
  const split = dateStr.split("T")[0].split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

export const overviewCols: (
  | ColDef<TransactionOverview>
  | ColGroupDef<TransactionOverview>
)[] = [
  {
    headerName: "Transaction ID",
    field: "transaction_id",
    resizable: false,
    flex: 1,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus underline font-medium cursor-pointer",
  },
  {
    headerName: "Date",
    field: "sale_date",
    resizable: false,
    flex: 1,
    valueFormatter: (params) => formatDate(params.value),
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Sale Type",
    field: "sale_type",
    resizable: false,
    flex: 1,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Store Number",
    field: "store_number",
    resizable: false,
    flex: 1,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Cashier Name",
    field: "cashier_name",
    resizable: false,
    flex: 1,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Cashier Number",
    field: "cashier_number",
    resizable: false,
    flex: 1,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Qty",
    field: "qty",
    resizable: false,
    flex: 0.7,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatBigNumber(params.value, 0),
    cellClass: "no-outline-on-focus text-right",
  },
  {
    headerName: "Total Sales",
    field: "total_sales",
    resizable: false,
    flex: 0.7,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
    cellClass: "no-outline-on-focus text-right",
  },
];

// sale date, upc, descption, total sales, sale_id
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
    headerName: "Date",
    field: "sale_date",
    flex: 0.5,
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

export const cashierColDefs: (
  | ColDef<UniqueCashier>
  | ColGroupDef<UniqueCashier>
)[] = [
  {
    headerName: "Cashier ID",
    field: "cashier_number",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Cashier",
    field: "cashier_name",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Trans Count",
    field: "transaction_count",
    flex: 1,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-center",
  },
  {
    headerName: "Sales",
    field: "total_sales",
    flex: 1,
    resizable: false,
    cellClass: "no-outline-on-focus text-right",
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => formatCurrency2(params.value),
  },
  {
    headerName: "Store",
    field: "store_number",
    flex: 0.9,
    resizable: false,
    cellClass: "no-outline-on-focus text-center",
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

export const activePanelStyle = (type: string, selected: string) => {
  if (selected === type) {
    return "bg-emerald-500 text-custom-white font-medium shadow-inner hover:shadow-lg";
  } else {
    return "bg-custom-white";
  }
};

// Grabbing the unique sale ids from the current state of the transaction list
export const reduceSaleIds = (data: TransactionOverview[]) => {
  return [...data].reduce((acc: string[], item) => {
    if (!acc.includes(item.sale_id)) {
      acc.push(item.sale_id);
    }
    return acc;
  }, []);
};

// Grabbing the unique price types from the current state of the transaction list
export const reducePriceTypes = (data: TransactionListItem[]) => {
  return [...data].reduce((acc: string[], item) => {
    if (item.price_type !== null && !acc.includes(item.price_type)) {
      acc.push(item.price_type);
    }
    return acc;
  }, []);
};
