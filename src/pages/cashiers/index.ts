import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import type {
  CashierTransaction,
  TransactionListItem,
  UniqueCashier,
} from "../../interfaces";
import { formatCurrency2, formatDate } from "../../utils";

// sale date, upc, descption, total sales, sale_id
export const colDefs: (
  | ColDef<TransactionListItem>
  | ColGroupDef<TransactionListItem>
)[] = [
  {
    headerName: "Trans ID",
    field: "sale_id",
    flex: 0.5,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    valueFormatter: (params) => params.value.split("-")[1],
    cellClass: "no-outline-on-focus underline font-medium cursor-pointer",
  },
  {
    headerName: "Sale ID",
    field: "sale_id",
    flex: 1,
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
    flex: 0.5,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Sale Date",
    field: "sale_date",
    flex: 0.45,
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
    flex: 1.4,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
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

export const filterData = (
  data: CashierTransaction[],
  selectedSaleType: string,
  storeNumber: string,
  cardSaleType: string,
) => {
  const saleType = selectedSaleType === "Description" ? cardSaleType : selectedSaleType;

  const test = [...data]
    .filter((t) => { 
      return t.sale_type === saleType && t.store_number === storeNumber;
    });

  console.log(test, storeNumber, saleType)

  const filtered = [...data]
    .filter((t) => { 
      return t.sale_type === saleType && t.store_number === storeNumber;
    })
    .reduce((acc: CashierTransaction[], current: CashierTransaction) => {
      const x = acc.find((item) => item.sale_id === current.sale_id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

  return filtered;
};

export const chunkData = (arr: any[], chunkSize: number = 3) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

export const activePanelStyle = (type: string, selected: string) => {
  if (selected === type) {
    return "bg-emerald-500 text-custom-white font-medium shadow-inner hover:shadow-lg";
  } else {
    return "bg-custom-white";
  }
};

// Grabbing the unique sale ids from the current state of the transaction list
export const reduceSaleIds = (data: TransactionListItem[]) => {
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
