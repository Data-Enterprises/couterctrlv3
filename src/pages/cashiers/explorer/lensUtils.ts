import { applyStoreNumberToName, numbersByStoreId } from "../../../utils/storeIdentity";
import type { TransactionListItem } from "../../../interfaces";
import type { ExplorerLens } from "../../../features/cashiersSlice";

export const LENSES: { key: ExplorerLens; label: string }[] = [
  { key: "store", label: "Store" },
  { key: "cashier", label: "Cashier" },
  { key: "item", label: "Item" },
  { key: "terminal", label: "Terminal" },
  // Hour is parked, not deleted — the grouping/labelling below still handles
  // it, so re-enabling is a one-line change once the time-of-day read is
  // worth surfacing.
  // { key: "hour", label: "Hour" },
];

// "Is this one person, or is it the item/lane?" — the flag that decides
// whether a signal is an investigation or a maintenance ticket. Anything a
// single cashier owns is behavior; the same exception spread across several
// cashiers is almost always a bad tag, a wrong price, or a broken lane.
export type SpreadKind = "single" | "narrow" | "wide" | "unmapped";

export interface Signal {
  key: string;
  label: string;
  sublabel: string;
  count: number;
  amount: number;
  transactions: number;
  cashiers: number;
  items: number;
  lastLineCount: number;
  topItem: { label: string; count: number } | null;
  spread: SpreadKind;
  spreadLabel: string;
  rows: TransactionListItem[];
}

// sale_start_time comes back as bare digits — "093045", or "93045" with the
// leading zero dropped — which is why Transaction.tsx formats it by slicing
// rather than parsing. A colon-based regex silently matches nothing on that
// shape, so handle the digit form first and treat colons as the fallback.
const clockDigits = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 3) return null;
  return digits.length % 2 === 1 ? `0${digits}` : digits;
};

export const parseHour = (raw: string | null | undefined): number | null => {
  const digits = clockDigits(raw);
  if (!digits) return null;
  const hour = Number(digits.slice(0, 2));
  return hour >= 0 && hour <= 23 ? hour : null;
};

export const formatClock = (raw: string | null | undefined): string => {
  const digits = clockDigits(raw);
  if (!digits) return "";
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

export const formatHourRange = (hour: number) => {
  const label = (h: number) => {
    const suffix = h < 12 ? "am" : "pm";
    const base = h % 12 === 0 ? 12 : h % 12;
    return `${base}${suffix}`;
  };
  return `${label(hour)} – ${label((hour + 1) % 24)}`;
};

// The API returns every line of a receipt, not just the exception lines, so
// the true transaction length has to come from the unfiltered set. Measuring it
// against the exception-only rows would make every exception look like the
// last line in its transaction.
export const buildTransactionLengths = (allRows: TransactionListItem[]) => {
  const lengths: Record<string, number> = {};
  allRows.forEach((row) => {
    const current = lengths[row.sale_id] ?? 0;
    if (row.line_number > current) lengths[row.sale_id] = row.line_number;
  });
  return lengths;
};

const distinct = <T>(rows: TransactionListItem[], pick: (r: TransactionListItem) => T) =>
  new Set(rows.map(pick)).size;

const topItemOf = (rows: TransactionListItem[]) => {
  const counts = new Map<string, { label: string; count: number }>();
  rows.forEach((r) => {
    const key = r.product_code;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else
      counts.set(key, {
        label: r.product_description || r.product_code,
        count: 1,
      });
  });
  let top: { label: string; count: number } | null = null;
  counts.forEach((v) => {
    if (!top || v.count > top.count) top = v;
  });
  return top;
};

const spreadFor = (
  lens: ExplorerLens,
  rows: TransactionListItem[],
  cashiers: number,
): { spread: SpreadKind; spreadLabel: string } => {
  if (lens === "item" && !rows[0]?.product_description) {
    return { spread: "unmapped", spreadLabel: "unmapped upc" };
  }
  if (lens === "cashier") {
    const items = distinct(rows, (r) => r.product_code);
    return {
      spread: items <= 2 ? "single" : "wide",
      spreadLabel: `${items} ${items === 1 ? "item" : "items"}`,
    };
  }
  const label = `${cashiers} ${cashiers === 1 ? "cashier" : "cashiers"}`;
  if (cashiers === 1) return { spread: "single", spreadLabel: label };
  if (cashiers === 2) return { spread: "narrow", spreadLabel: label };
  return { spread: "wide", spreadLabel: label };
};

const groupKeyFor = (lens: ExplorerLens, row: TransactionListItem): string | null => {
  switch (lens) {
    case "store":
      // storeid + store_number — a few storeids cover two physical locations,
      // and grouping on the id alone merges them. See utils/storeIdentity.
      return `${row.storeid}__${row.store_number}`;
    case "cashier":
      return String(row.cashier_number);
    case "item":
      return row.product_code;
    case "terminal":
      return row.terminal || "";
    case "hour": {
      const hour = parseHour(row.sale_start_time);
      return hour === null ? null : String(hour);
    }
  }
};

// Store names resolve through the logged-in user's own assignedStores rather
// than the store_name on the row — the API's copy comes back null for closed
// stores, which is exactly the set an exception report is likely to surface.
export type StoreNameResolver = (storeid: number, fallback: string) => string;

const labelsFor = (
  lens: ExplorerLens,
  row: TransactionListItem,
  key: string,
  resolveStoreName: StoreNameResolver,
  numbersForStoreId: string[],
) => {
  switch (lens) {
    case "store":
      return {
        label: applyStoreNumberToName(
          resolveStoreName(row.storeid, row.store_name || `Store ${row.storeid}`),
          row.store_number,
          numbersForStoreId,
        ),
        sublabel: row.store_number ? `#${row.store_number}` : "",
      };
    case "cashier":
      return {
        label: row.cashier_name || `Cashier ${row.cashier_number}`,
        sublabel: `#${row.cashier_number} · store ${row.store_number}`,
      };
    case "item":
      return {
        label: row.product_description || "(no description)",
        sublabel: row.product_code,
      };
    case "terminal":
      return {
        label: `Lane ${row.terminal || "—"}`,
        sublabel: `store ${row.store_number}`,
      };
    case "hour":
      return { label: formatHourRange(Number(key)), sublabel: "" };
  }
};

export const buildSignals = (
  exceptionRows: TransactionListItem[],
  transactionLengths: Record<string, number>,
  lens: ExplorerLens,
  resolveStoreName: StoreNameResolver,
): Signal[] => {
  // storeid -> its store_numbers, so co-located locations can be labelled
  // apart (their names resolve by storeid and are identical).
  const numbersById = numbersByStoreId(
    exceptionRows,
    (r) => r.storeid,
    (r) => r.store_number,
  );
  const groups = new Map<string, TransactionListItem[]>();
  exceptionRows.forEach((row) => {
    const key = groupKeyFor(lens, row);
    if (key === null) return;
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  });

  const signals: Signal[] = [];
  groups.forEach((rows, key) => {
    const cashiers = distinct(rows, (r) => r.cashier_number);
    const { spread, spreadLabel } = spreadFor(lens, rows, cashiers);
    signals.push({
      key,
      ...labelsFor(lens, rows[0], key, resolveStoreName, numbersById[rows[0].storeid] ?? []),
      count: rows.length,
      amount: rows.reduce((sum, r) => sum + (r.total_sales ?? 0), 0),
      transactions: distinct(rows, (r) => r.sale_id),
      cashiers,
      items: distinct(rows, (r) => r.product_code),
      lastLineCount: rows.filter(
        (r) => transactionLengths[r.sale_id] === r.line_number,
      ).length,
      topItem: lens === "item" ? null : topItemOf(rows),
      spread,
      spreadLabel,
      rows,
    });
  });

  return signals.sort((a, b) => b.count - a.count || b.amount - a.amount);
};

export interface SignalTransaction {
  saleId: string;
  saleDate: string;
  startTime: string;
  cashierName: string;
  cashierNumber: number;
  lineCount: number;
  totalLines: number;
  qty: number;
  amount: number;
  hasLastLine: boolean;
}

// A signal's rows are exception LINES, and one transaction can contribute many
// of them (the same item voided eleven times in a single sale). Listing rows
// straight would repeat that transaction eleven times and contradict the
// transaction count shown alongside it, so the drill-down collapses to one row
// per transaction with the line count carried on it.
export const groupSignalByTransaction = (
  signal: Signal,
  transactionLengths: Record<string, number>,
): SignalTransaction[] => {
  const groups = new Map<string, SignalTransaction>();
  signal.rows.forEach((row) => {
    const existing = groups.get(row.sale_id);
    const isLast = transactionLengths[row.sale_id] === row.line_number;
    if (existing) {
      existing.lineCount += 1;
      existing.qty += row.qty ?? 0;
      existing.amount += row.total_sales ?? 0;
      existing.hasLastLine = existing.hasLastLine || isLast;
      return;
    }
    groups.set(row.sale_id, {
      saleId: row.sale_id,
      saleDate: row.sale_date,
      startTime: row.sale_start_time,
      cashierName: row.cashier_name,
      cashierNumber: row.cashier_number,
      lineCount: 1,
      totalLines: transactionLengths[row.sale_id] ?? row.line_number,
      qty: row.qty ?? 0,
      amount: row.total_sales ?? 0,
      hasLastLine: isLast,
    });
  });

  return Array.from(groups.values()).sort((a, b) =>
    `${b.saleDate}${b.startTime}`.localeCompare(`${a.saleDate}${a.startTime}`),
  );
};

// The one-line read-out above the drill-down. This is the whole point of the
// page — stating the pattern outright instead of leaving the user to assemble
// it from the rows underneath.
export const describeSignal = (signal: Signal, lens: ExplorerLens): string => {
  const parts: string[] = [];
  // "line", not "transaction" — one transaction can carry several exception lines,
  // and conflating the two overstates how often something happened.
  const hits = `${signal.count} ${signal.count === 1 ? "line" : "lines"}`;

  if (lens === "item") {
    if (signal.spread === "unmapped") {
      parts.push(
        `${hits} on a UPC with no description — likely an unmapped item rather than cashier behavior.`,
      );
    } else if (signal.cashiers === 1) {
      parts.push(`One cashier, one item, ${signal.count} times.`);
    } else if (signal.cashiers >= 3) {
      parts.push(
        `${hits} across ${signal.cashiers} cashiers — points at the item or its tag, not one person.`,
      );
    } else {
      parts.push(`${hits} across ${signal.cashiers} cashiers.`);
    }
  } else if (lens === "store") {
    if (signal.cashiers === 1) {
      parts.push(
        `${hits} at this store, all from one cashier — start there rather than the store.`,
      );
    } else {
      parts.push(
        `${hits} across ${signal.cashiers} cashiers and ${signal.items} items.`,
      );
    }
    if (signal.topItem && signal.topItem.count > 1) {
      parts.push(
        `Most repeated: ${signal.topItem.label} (${signal.topItem.count}×).`,
      );
    }
  } else if (lens === "cashier") {
    parts.push(`${hits} across ${signal.transactions} transactions.`);
    if (signal.topItem && signal.topItem.count > 1) {
      parts.push(
        `Most repeated: ${signal.topItem.label} (${signal.topItem.count}×).`,
      );
    }
  } else if (lens === "terminal") {
    if (signal.cashiers >= 3) {
      parts.push(
        `${hits} on this lane across ${signal.cashiers} cashiers — worth checking the hardware before the people.`,
      );
    } else {
      parts.push(`${hits} on this lane across ${signal.cashiers} cashiers.`);
    }
  } else {
    parts.push(
      `${hits} in this hour across ${signal.cashiers} ${signal.cashiers === 1 ? "cashier" : "cashiers"}.`,
    );
  }

  if (signal.lastLineCount > 0) {
    parts.push(
      `${signal.lastLineCount} of ${signal.count} landed on the last line of the transaction.`,
    );
  }
  return parts.join(" ");
};

export interface ExplorerTotals {
  exceptions: number;
  transactions: number;
  amount: number;
  stores: number;
  cashiers: number;
  items: number;
}

export const buildTotals = (rows: TransactionListItem[]): ExplorerTotals => ({
  exceptions: rows.length,
  transactions: distinct(rows, (r) => r.sale_id),
  amount: rows.reduce((sum, r) => sum + (r.total_sales ?? 0), 0),
  stores: distinct(rows, (r) => r.storeid),
  cashiers: distinct(rows, (r) => r.cashier_number),
  items: distinct(rows, (r) => r.product_code),
});
