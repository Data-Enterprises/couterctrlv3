import type {
  CashierTransaction,
  TransactionListItem,
} from "../../../interfaces";
import type { WeekWindow } from "../lpActionsMetrics";
import { laneOf } from "../lpActionsMetrics";
import { lineQty } from "../../inventory/pricePoints";
import { hourOf } from "../case/hourProfile";
import { hourLabel } from "../case/chartTheme";
import { formatDateSimple } from "../../../utils";

/**
 * One exception type, broken apart every way the data allows.
 *
 * The rings answer "what is this cashier connected to". Once a reader has
 * picked one of those connections the next question is always "connected
 * *how*" — the same nine voids are a Friday habit, one lane, one hour, or one
 * item, and which of those it is decides whether anyone acts. So the drill
 * re-cuts a single type against each axis in turn rather than showing more of
 * the same fan.
 *
 * Facets split in two. Day, week and lane come off the walked rows and are
 * free. Hour, item and tender need the receipt lines, so they are honest about
 * being empty until those arrive rather than rendering as "no pattern".
 */
export type FacetKey = "dow" | "week" | "lane" | "hour" | "item" | "tender";

export interface FacetSpec {
  key: FacetKey;
  label: string;
  /** Needs `transaction_list` lines, not just the walked exception rows. */
  needsLines: boolean;
  /** What one branch is, for the empty state. */
  noun: string;
}

export const FACETS: FacetSpec[] = [
  { key: "dow", label: "Day of week", needsLines: false, noun: "day" },
  { key: "week", label: "Week", needsLines: false, noun: "week" },
  { key: "lane", label: "Lane", needsLines: false, noun: "lane" },
  { key: "hour", label: "Hour", needsLines: true, noun: "hour" },
  { key: "item", label: "Item", needsLines: true, noun: "item" },
  { key: "tender", label: "Tender", needsLines: true, noun: "tender type" },
];

export interface FacetBranch {
  key: string;
  label: string;
  /** Occurrences — rows for a row facet, lines for an item facet. */
  count: number;
  receipts: number;
  value: number;
  /** The receipts this branch is made of. Everything downstream filters on
   *  these rather than re-deriving the branch's rule. */
  saleIds: string[];
}

/** Beyond this the spokes stop being readable; the tail rolls into one
 *  selectable branch rather than being dropped silently. */
export const MAX_BRANCHES = 9;

const DOW = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const dowOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

/** A receipt's own total, counted once. The walk returns a row per occurrence
 *  carrying the same receipt total, so summing rows triples a three-line
 *  void. */
const receiptValue = (rows: CashierTransaction[]) => {
  const seen = new Map<string, number>();
  for (const r of rows) seen.set(r.sale_id, Math.abs(r.total_sales ?? 0));
  return [...seen.values()].reduce((acc, n) => acc + n, 0);
};

interface Bucket {
  label: string;
  order: number;
  rows: CashierTransaction[];
  lines: TransactionListItem[];
  ids: Set<string>;
}

const emptyBucket = (label: string, order: number): Bucket => ({
  label,
  order,
  rows: [],
  lines: [],
  ids: new Set<string>(),
});

export const buildBranches = (
  rows: CashierTransaction[],
  lines: TransactionListItem[],
  windows: WeekWindow[],
  saleType: string,
  facet: FacetKey,
): FacetBranch[] => {
  const buckets = new Map<string, Bucket>();
  const put = (key: string, label: string, order: number) => {
    const found = buckets.get(key) ?? emptyBucket(label, order);
    buckets.set(key, found);
    return found;
  };

  // The walked rows carry the register under a misspelled key that no other
  // screen reads, so it cannot be trusted to be there. The receipt lines carry
  // it correctly spelled, and the drill has already fetched them — so a row
  // with no lane borrows one from its own receipt before giving up.
  const laneByReceipt = new Map<string, string>();
  if (facet === "lane") {
    for (const l of lines) {
      const lane = String(l.terminal ?? "").trim();
      if (lane && !laneByReceipt.has(l.sale_id))
        laneByReceipt.set(l.sale_id, lane);
    }
  }

  if (facet === "dow" || facet === "week" || facet === "lane") {
    for (const r of rows) {
      const day = r.sale_date.slice(0, 10);
      let key = "";
      let label = "";
      let order = 0;
      if (facet === "dow") {
        const d = dowOf(day);
        key = String(d);
        label = DOW[d];
        order = d;
      } else if (facet === "week") {
        const wi = windows.findIndex((w) => day >= w.start && day <= w.end);
        if (wi < 0) continue;
        key = windows[wi].end;
        label = formatDateSimple(windows[wi].end);
        order = wi;
      } else {
        key = laneOf(r) || laneByReceipt.get(r.sale_id) || "—";
        label = key === "—" ? "Unknown lane" : `Lane ${key}`;
      }
      const bucket = put(key, label, order);
      bucket.rows.push(r);
      bucket.ids.add(r.sale_id);
    }
  } else {
    const mine = new Set(rows.map((r) => r.sale_id));
    const wanted = facet === "tender" ? "Tender" : saleType;
    const scoped = lines.filter(
      (l) => l.sale_type === wanted && mine.has(l.sale_id),
    );

    if (facet === "hour") {
      // One receipt happened at one moment, however many lines it carries.
      const seen = new Set<string>();
      for (const l of scoped) {
        if (seen.has(l.sale_id)) continue;
        seen.add(l.sale_id);
        const h = hourOf(l);
        if (h < 0) continue;
        const bucket = put(String(h), hourLabel(h), h);
        bucket.lines.push(l);
        bucket.ids.add(l.sale_id);
      }
    } else {
      for (const l of scoped) {
        const key =
          facet === "item"
            ? String(l.product_code)
            : (l.product_description || l.price_type || "Unknown").trim();
        const label =
          facet === "item"
            ? l.product_description || String(l.product_code)
            : key;
        const bucket = put(key, label, 0);
        bucket.lines.push(l);
        bucket.ids.add(l.sale_id);
      }
    }
  }

  interface Ordered extends FacetBranch {
    order: number;
  }

  const all: Ordered[] = [...buckets.entries()].map(([key, b]) => {
    const fromRows = b.rows.length > 0;
    return {
      key,
      label: b.label,
      order: b.order,
      count: fromRows
        ? b.rows.length
        : b.lines.reduce((acc, l) => acc + Math.abs(lineQty(l) || 1), 0),
      receipts: b.ids.size,
      value: fromRows
        ? receiptValue(b.rows)
        : b.lines.reduce((acc, l) => acc + Math.abs(l.net_sales ?? 0), 0),
      saleIds: [...b.ids],
    };
  });

  const chronological = facet === "dow" || facet === "week" || facet === "hour";
  const ordered = chronological
    ? all.sort((a, b) => a.order - b.order)
    : all.sort((a, b) => b.count - a.count || b.value - a.value);

  if (ordered.length <= MAX_BRANCHES) return ordered;

  // Roll the tail up rather than truncating: a reader who cannot see the
  // remainder cannot tell a long tail from a clean pattern.
  const head = ordered.slice(0, MAX_BRANCHES - 1);
  const tail = ordered.slice(MAX_BRANCHES - 1);
  return [
    ...head,
    {
      key: "__rest__",
      label: `${tail.length} more`,
      count: tail.reduce((acc, b) => acc + b.count, 0),
      receipts: new Set(tail.flatMap((b) => b.saleIds)).size,
      value: tail.reduce((acc, b) => acc + b.value, 0),
      saleIds: [...new Set(tail.flatMap((b) => b.saleIds))],
    },
  ];
};
