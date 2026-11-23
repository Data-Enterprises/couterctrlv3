// Utils
import { formatGoliathDate } from "../../../../utils";

// Interfaces
import type {
  CashierDetails,
  TransactionListItem,
  TransactionOverview,
  UniqueCashier,
} from "../../../../interfaces";

/** Store rows summed per store, for the two baseline days of a day filter.
 *  Averages are re-derived rather than added — adding two means is wrong. */
export const sumByStore = (rows: CashierDetails[]): CashierDetails[] => {
  const map = new Map<string, CashierDetails>();
  for (const r of rows) {
    const key = `${r.storeid}__${r.store_number}`;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, { ...r });
      continue;
    }
    cur.transaction_count += r.transaction_count;
    cur.total_items += r.total_items;
    cur.amount += r.amount;
    cur.qty += r.qty;
    cur.weight += r.weight;
    cur.cashier_count = Math.max(cur.cashier_count, r.cashier_count);
    cur.average_dollars =
      cur.transaction_count > 0 ? cur.amount / cur.transaction_count : 0;
    cur.average_qty =
      cur.transaction_count > 0 ? cur.qty / cur.transaction_count : 0;
    cur.avg_item_amount =
      cur.total_items > 0 ? cur.amount / cur.total_items : 0;
    cur.avg_item_qty = cur.total_items > 0 ? cur.qty / cur.total_items : 0;
  }
  return [...map.values()];
};

/** The cashiers in a store's transactions: each one's count of distinct
 *  sales, their sale ids and their total. */
export const uniqueCashiersOf = (
  trans: TransactionListItem[],
): UniqueCashier[] =>
  trans.reduce((acc: UniqueCashier[], curr) => {
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
      if (!found.transaction_ids.includes(curr.sale_id)) {
        found.transaction_ids.push(curr.sale_id);
        found.transaction_count += 1;
      }
      found.total_sales += curr.total_sales;
    }
    return acc;
  }, []);

/** One overview per transaction: its line count and total. */
export const overviewsOf = (
  formatted: TransactionListItem[],
): TransactionOverview[] =>
  formatted.reduce((acc: TransactionOverview[], curr) => {
    const found = acc.find(
      (item) => item.transaction_id === curr.transaction_id,
    );
    if (!found) {
      acc.push({
        transaction_id: curr.transaction_id,
        sale_date: curr.sale_date,
        sale_type: curr.sale_type,
        store_number: curr.store_number,
        cashier_name: curr.cashier_name,
        cashier_number: curr.cashier_number,
        qty: 1,
        total_sales: curr.total_sales,
        sale_id: curr.sale_id,
        storeid: curr.storeid,
      });
    } else {
      found.qty += 1;
      found.total_sales += curr.total_sales;
    }
    return acc;
  }, []);

/** One overview per transaction from raw `cashier_table` rows, for the
 *  two-week baseline that grades the cashiers. */
export const baselineOverviewsOf = (baseTrans: any[]): TransactionOverview[] =>
  baseTrans.reduce((acc: TransactionOverview[], curr: any) => {
    const found = acc.find(
      (o) => o.transaction_id === curr.sale_id.split("-")[1],
    );
    if (!found) {
      acc.push({
        transaction_id: curr.sale_id.split("-")[1],
        sale_date: curr.sale_date.split("T")[0],
        sale_type: curr.sale_type,
        store_number: curr.store_number,
        cashier_name: curr.cashier_name,
        cashier_number: curr.cashier_number,
        qty: 1,
        total_sales: curr.total_sales,
        sale_id: curr.sale_id,
        storeid: curr.storeid,
      });
    } else {
      found.qty += 1;
      found.total_sales += curr.total_sales;
    }
    return acc;
  }, []);

/** The searched week (the seven days ending on `weekDate`, m/d/yyyy) and the
 *  two weeks before it, as API dates. */
export const weekWindows = (weekDate: string) => {
  const [sm, sd, sy] = weekDate.split("/").map(Number);
  const endD = new Date(sy, sm - 1, sd);
  const startD = new Date(endD);
  startD.setDate(startD.getDate() - 6);
  const baseEndD = new Date(endD);
  baseEndD.setDate(baseEndD.getDate() - 7);
  const baseStartD = new Date(endD);
  baseStartD.setDate(baseStartD.getDate() - 20);
  const fmt = (d: Date) =>
    formatGoliathDate(`${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`);
  return {
    start: fmt(startD),
    end: fmt(endD),
    baseStart: fmt(baseStartD),
    baseEnd: fmt(baseEndD),
  };
};
