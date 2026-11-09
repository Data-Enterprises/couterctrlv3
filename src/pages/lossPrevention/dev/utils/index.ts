// Utils
import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import { formatCurrency2 } from "../../../../utils";

// Interfaces
import type {
  TransactionListItem,
  TransactionOverview,
  UniqueCashier,
} from "../../../../interfaces";
import type { Severity } from "../../../../utils/severity";

export const formatDate = (dateStr: string) => {
  const split = dateStr.split("T")[0].split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

export const cashierColDefs: (
  | ColDef<UniqueCashier>
  | ColGroupDef<UniqueCashier>
)[] = [
  {
    headerName: "Cashier ID",
    field: "cashier_number",
    flex: 1,
    resizable: false,
    hide: true,
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
    return "bg-row_selected";
  } else {
    return "bg-bkg";
  }
};

export const reduceTransactions = (data: TransactionListItem[]) => {
  return data.reduce((acc: TransactionListItem[], curr) => {
    const found = acc.find(
      (item) =>
        item.storeid === curr.storeid &&
        item.sale_type === curr.sale_type &&
        item.product_code === curr.product_code &&
        item.product_description === curr.product_description,
    );
    if (found) {
      found.qty! += curr.qty!;
      found.total_sales += curr.total_sales;
      found.net_sales += curr.net_sales;
      found.total_rounded_tax += curr.total_rounded_tax;
    } else {
      acc.push({ ...curr, qty: curr.qty });
    }
    return acc;
  }, []);
};

export const chunkSales = (data: TransactionListItem[]) => {
  const chunked: TransactionListItem[][] = [];
  let result: TransactionListItem[] = [];
  data.forEach((item, i) => {
    // if starting a new chunk or every item shares the same sale_id
    if (
      result.length === 0 ||
      result.every((res) => res.sale_id === item.sale_id)
    ) {
      result.push(item);

      // if at the end, then push the final chunk otherwise, it gets left out
      if (i === data.length - 1) {
        chunked.push(result);
      }
    } else {
      // if this new sale_id is different, push the current chunk and start a new one
      chunked.push(result);
      result = [];
      result.push(item);
    }
  });
  return chunked;
};

export const reduceCashiers = (data: TransactionListItem[]) => {
  return data.reduce((acc: UniqueCashier[], curr) => {
    const found = acc.find(
      (item) => item.cashier_number === curr.cashier_number,
    );

    if (!found) {
      acc.push({
        cashier_name: curr.cashier_name,
        cashier_number: curr.cashier_number,
        total_sales: curr.total_sales,
        transaction_count: 1,
        store_number: curr.store_number,
        transaction_ids: [curr.sale_id],
      });
    } else {
      // if found but the transaction_id is not in the array, add it and increment transaction_count by 1
      // else, do nothing since the unique transaction_id is already accounted for
      if (!found.transaction_ids.includes(curr.sale_id)) {
        found.transaction_ids.push(curr.sale_id);
        found.transaction_count += 1;
      }
      found.total_sales += curr.total_sales;
    }
    return acc;
  }, []);
};

/** A yyyy-mm-dd day moved by a number of days. */
export const shiftDays = (iso: string, delta: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

/** The transactions of one yyyy-mm-dd day. */
export const dayOf = (rows: TransactionOverview[], iso: string) =>
  rows.filter((r) => r.sale_date.split("T")[0] === iso);

// Signed, deliberately — the cards must read the same way as the KPI strip
// above them. Refunded is negative there, so it is negative here too.
//
// This used to abs() each row before summing, which did two things wrong: it
// dropped the sign the KPI strip keeps, and inside Voided it turned
// coupon-reversal baskets (whose every line is negative) into additions,
// putting the strip over the header by exactly twice the coupon total.
//
// The delta below is unaffected: when the day and its baseline share a sign,
// (c - r) / r is identical either way.
export const totals = (rows: TransactionOverview[]) => ({
  count: rows.length,
  amount: rows.reduce((s, r) => s + r.total_sales, 0),
});

/** Worst-first order of the severities. */
export const SEV_RANK: Record<Severity, number> = { critical: 0, watch: 1, healthy: 2 };
