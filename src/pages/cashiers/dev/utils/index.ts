// Utils
import { applyStoreNumberToName, numbersByStoreId } from "../../../../utils/storeIdentity";
import { fmtNum, rowsToCsv } from "../../../../utils/csvExport";

// Interfaces
import type { ExplorerTotals, Signal, SignalTransaction, SpreadKind, StoreNameResolver } from "../interfaces";
import type { TransactionListItem } from "../../../../interfaces";
import type { ExplorerLens } from "../../../../features/dev/devCashiersSlice";
import type { AggFn, AggRow } from "../../../../utils/csvExport";

export const LENSES: { key: ExplorerLens; label: string }[] = [
  { key: "store", label: "Store" },
  { key: "cashier", label: "Cashier" },
  { key: "item", label: "Item" },
  { key: "terminal", label: "Terminal" },
];

// sale_start_time comes back as bare digits ("093045" or "93045"), so the
// digit form is handled first and colons are the fallback.
const clockDigits = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 3) return null;
  return digits.length % 2 === 1 ? `0${digits}` : digits;
};

/**
 * What the signal list is a list of, for the drill's Back control: the lens
 * label's plural, lowercased ("stores", "cashiers"...).
 */
export const lensListLabel = (lens: ExplorerLens) => {
  const label = LENSES.find((l) => l.key === lens)?.label ?? "signal";
  return `${label.toLowerCase()}s`;
};

/**
 * The transaction number a till receipt is printed with: the second field of
 * the compound `sale_id` ("1550-417853-1-10-14-2026"). Falls back to the
 * whole id, so an unexpected shape shows rather than blanks.
 */
export const transactionLabel = (saleId: string) =>
  saleId.split("-")[1] ?? saleId;

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

// Transaction length comes from the unfiltered rows (every receipt line);
// the exception rows alone would make each exception look like the last line.
export const buildTransactionLengths = (allRows: TransactionListItem[]) => {
  const lengths: Record<string, number> = {};
  allRows.forEach((row) => {
    const current = lengths[row.sale_id] ?? 0;
    if (row.line_number > current) lengths[row.sale_id] = row.line_number;
  });
  return lengths;
};

// A receipt needs every line of the sale, in till order (not guaranteed by
// the API). sale_id is coerced: ids have come back as numbers.
export const receiptLinesFor = (
  allRows: TransactionListItem[],
  saleId: string,
): TransactionListItem[] =>
  allRows
    .filter((r) => String(r.sale_id) === String(saleId))
    .sort((a, b) => a.line_number - b.line_number);

// Store identity is storeid + store_number (a few storeids cover two
// locations; see utils/storeIdentity). Cashier and lane numbers are only
// unique within a store, so in a group search they carry the store too.
export const storeKeyOf = (r: TransactionListItem) =>
  `${r.storeid}__${r.store_number}`;
export const cashierKeyOf = (r: TransactionListItem) =>
  `${storeKeyOf(r)}__${r.cashier_number}`;
export const terminalKeyOf = (r: TransactionListItem) =>
  `${storeKeyOf(r)}__${r.terminal || ""}`;

const distinct = <T>(rows: TransactionListItem[], pick: (r: TransactionListItem) => T) =>
  new Set(rows.map(pick)).size;

const topItemOf = (rows: TransactionListItem[]) => {
  const counts = new Map<string, { label: string; count: number }>();
  rows.forEach((r) => {
    const key = String(r.product_code);
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else
      counts.set(key, {
        label: r.product_description || String(r.product_code),
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
    const items = distinct(rows, (r) => String(r.product_code));
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
      return storeKeyOf(row);
    case "cashier":
      return cashierKeyOf(row);
    case "item":
      return String(row.product_code);
    case "terminal":
      return terminalKeyOf(row);
    case "hour": {
      const hour = parseHour(row.sale_start_time);
      return hour === null ? null : String(hour);
    }
  }
};

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
        sublabel: String(row.product_code),
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
    const cashiers = distinct(rows, cashierKeyOf);
    const { spread, spreadLabel } = spreadFor(lens, rows, cashiers);
    signals.push({
      key,
      ...labelsFor(lens, rows[0], key, resolveStoreName, numbersById[rows[0].storeid] ?? []),
      count: rows.length,
      amount: rows.reduce((sum, r) => sum + (r.total_sales ?? 0), 0),
      transactions: distinct(rows, (r) => r.sale_id),
      cashiers,
      items: distinct(rows, (r) => String(r.product_code)),
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

// A signal's rows are exception lines, and one transaction can hold many, so
// the drill-down collapses to one row per transaction with its line count.
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

// The one-line read-out above the drill-down: the pattern, stated outright.
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

export const buildTotals = (rows: TransactionListItem[]): ExplorerTotals => ({
  exceptions: rows.length,
  transactions: distinct(rows, (r) => r.sale_id),
  amount: rows.reduce((sum, r) => sum + (r.total_sales ?? 0), 0),
  stores: distinct(rows, storeKeyOf),
  cashiers: distinct(rows, cashierKeyOf),
  items: distinct(rows, (r) => String(r.product_code)),
});

// LP grades against "the prior 2 weeks" (lossPrevention/lpInfo.ts), so the
// explorer uses the same ceiling, which also bounds the group fetch.
export const MAX_RANGE_DAYS = 14;

// A group query can span hundreds of stores. Past this many transactions the
// receipt fetch stops being interactive, so it's capped and the user is told.
export const MAX_TRANSACTIONS = 1500;

/** Days from start to end, both counted; 0 when either date is unreadable. */
export const dayDiff = (start: string, end: string) => {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round(Math.abs(b - a) / 86400000) + 1;
};

/** How a custom export combines a figure. */
export const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Avg" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

/** How many rows the custom preview shows. */
export const PREVIEW_ROWS = 12;

/** Each lens's name as an export column heading. */
export const LENS_LABEL: Record<ExplorerLens, string> = {
  store: "Store",
  cashier: "Cashier",
  item: "Item",
  terminal: "Terminal",
  // Hour is still in the ExplorerLens union but commented out of LENSES —
  // labelled here so the record stays exhaustive if it comes back.
  hour: "Hour",
};

/** A yyyy-mm-dd date as mm/dd/yyyy. */
export const fmtDate = (iso: string) => {
  const d = iso.split("T")[0].split("-");
  return `${d[1]}/${d[2]}/${d[0]}`;
};

/** The Signals preset as CSV, one row per signal. */
export const buildSignalsCsv = (signals: Signal[], lens: ExplorerLens) => {
  const headers = [
    LENS_LABEL[lens],
    "Detail",
    "Exception Lines",
    "Transactions",
    "Cashiers",
    "Items",
    "Amount",
    "Last Line",
    "Top Item",
    "Spread",
  ];
  const data = signals.map((s) => [
    s.label,
    s.sublabel,
    s.count,
    s.transactions,
    s.cashiers,
    s.items,
    fmtNum(s.amount),
    s.lastLineCount,
    s.topItem ? `${s.topItem.label} (${s.topItem.count})` : "",
    s.spreadLabel,
  ]);
  return rowsToCsv(headers, data);
};

/** The Transactions preset as CSV, one row per transaction behind each signal. */
export const buildTransactionsCsv = (
  signals: Signal[],
  lengths: Record<string, number>,
  lens: ExplorerLens,
) => {
  const headers = [
    LENS_LABEL[lens],
    "Sale ID",
    "Date",
    "Start Time",
    "Cashier #",
    "Cashier Name",
    "Exception Lines",
    "Total Lines",
    "Qty",
    "Amount",
    "Ends Transaction",
  ];
  const data = signals.flatMap((s) =>
    groupSignalByTransaction(s, lengths).map((t) => [
      s.label,
      t.saleId,
      fmtDate(t.saleDate),
      t.startTime,
      t.cashierNumber,
      t.cashierName,
      t.lineCount,
      t.totalLines,
      t.qty,
      fmtNum(t.amount),
      t.hasLastLine ? "Yes" : "No",
    ]),
  );
  return rowsToCsv(headers, data);
};

/** The Lines preset as CSV, one row per receipt line. */
export const buildLinesCsv = (rows: TransactionListItem[]) => {
  const headers = [
    "Sale ID",
    "Trans ID",
    "Date",
    "Store #",
    "Store Name",
    "Terminal",
    "Cashier #",
    "Cashier Name",
    "Line #",
    "UPC",
    "Description",
    "Qty",
    "Sale Type",
    "Total Sales",
  ];
  const data = rows.map((r) => [
    r.sale_id,
    r.transaction_id,
    fmtDate(r.sale_date),
    r.store_number,
    r.store_name,
    r.terminal,
    r.cashier_number,
    r.cashier_name,
    r.line_number,
    r.product_code,
    r.product_description ?? "",
    r.qty ?? 0,
    r.sale_type,
    fmtNum(r.total_sales),
  ]);
  return rowsToCsv(headers, data);
};

/** The dimensions a custom export can group by. */
export const DIMS: { key: string; label: string }[] = [
  { key: "store", label: "Store" },
  { key: "cashier", label: "Cashier" },
  { key: "terminal", label: "Terminal" },
  { key: "item", label: "Item" },
  { key: "date", label: "Date" },
  { key: "saleType", label: "Sale Type" },
];

/** The figures a custom export can total. */
export const METRICS: { key: string; label: string }[] = [
  { key: "amount", label: "Amount" },
  { key: "qty", label: "Qty" },
  { key: "lineNumber", label: "Line #" },
  { key: "lines", label: "Exception Lines" },
];

/** Receipt lines as the custom export's flat rows. */
export const toAggRows = (rows: TransactionListItem[]): AggRow[] =>
  rows.map((r) => ({
    store: `${r.store_number} — ${r.store_name}`,
    cashier: `${r.cashier_number} — ${r.cashier_name}`,
    terminal: r.terminal,
    item: `${r.product_code} — ${r.product_description ?? ""}`,
    date: fmtDate(r.sale_date),
    saleType: r.sale_type,
    amount: r.total_sales,
    qty: r.qty ?? 0,
    lineNumber: r.line_number,
    // Counting rows is the natural "how many exceptions" metric, and count
    // needs a column to count.
    lines: 1,
  }));

/** Each lens's name as the list's first column heading. */
export const LENS_COLUMN_LABEL: Record<ExplorerLens, string> = {
  store: "Store",
  cashier: "Cashier",
  item: "Item",
  terminal: "Terminal",
  hour: "Hour",
};

// One cashier owning every hit reads as behaviour; spread across many, an
// item or lane problem. Only those two ends are coloured.
export const SPREAD_STYLES: Record<SpreadKind, string> = {
  single: "bg-red-50 text-red-700",
  narrow: "bg-red-50 text-red-700",
  wide: "bg-amber-50 text-amber-800",
  unmapped: "bg-amber-50 text-amber-800",
};

// Scalable items come back with fractional qty (weight), so only show decimals
// when there actually are any.
export const formatQty = (qty: number) =>
  Number.isInteger(qty) ? String(qty) : qty.toFixed(2);

/** The signal detail table's columns. */
export const GRID_COLS =
  "grid-cols-[1.1fr_0.75fr_1.1fr_0.65fr_0.45fr_0.75fr]";

/** The sunken navy fill of a transaction's chips. */
export const chipStyle = {
  background: "rgb(var(--color-brand-navy) / 0.06)",
  boxShadow: "inset 0 1px 2px rgb(var(--color-brand-navy) / 0.08)",
};

/** An hhmmss time (leading zero optional) as hh:mm:ss. */
export const fmtTime = (raw: string) => {
  const s = raw.length === 5 ? "0" + raw : raw;
  return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4)}`;
};
