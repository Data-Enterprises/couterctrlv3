// Interfaces
import type {
  TransactionListItem,
  TransactionOverview,
} from "../../../../interfaces";
import type { Severity } from "../../../../utils/severity";

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
