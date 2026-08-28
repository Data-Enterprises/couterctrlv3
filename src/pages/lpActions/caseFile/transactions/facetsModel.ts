import type { TransactionListItem } from "../../../../interfaces";
import { weekdayOf } from "../../../lossPrevention/gradingUtils";
import { hourOf } from "../../case/hourProfile";
import { hueFor, typeOrder } from "../../typeColour";

/**
 * The evidence, and the facets that narrow it.
 *
 * A row here is one exception occurrence, built from the receipt LINE rather
 * than the walked transaction — the line is the only thing carrying the item,
 * the quantity, the amount and the time, and every column below the first four
 * would otherwise be blank.
 *
 * The rule that is easy to get wrong is in `buildFacets`: a facet group is
 * counted with every OTHER group's filter applied but not its own. Get that
 * backwards and selecting one lane collapses the rest to zero, which makes
 * multi-select inside a group useless and hides "picking lane 4 as well would
 * add 45 more" — the one thing the counts are there to answer.
 */

export type FacetKey = "type" | "dow" | "time" | "lane" | "tender";

export interface EvidenceRow {
  /** `saleId:lineNumber` — a receipt can carry the same item twice. */
  id: string;
  saleId: string;
  /** yyyy-mm-dd, store-local. */
  date: string;
  /** Raw `hhmmss`, kept for sorting; `hour` is what the facets bin on. */
  time: string;
  hour: number;
  lane: string;
  saleType: string;
  item: string;
  qty: number;
  amount: number;
  tender: string;
  lineNumber: number;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  /** Only the type facet carries one — the other groups are not series. */
  swatch?: string;
}

export interface FacetGroup {
  key: FacetKey;
  label: string;
  values: FacetValue[];
}

export type FacetState = Record<string, string[]>;

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Four blocks rather than twenty-four hours: a facet list has to stay
 *  scannable, and "evenings" is the shape people actually describe. */
const BLOCKS: { key: string; label: string; from: number; to: number }[] = [
  { key: "morning", label: "Open – 11a", from: 0, to: 11 },
  { key: "midday", label: "11a – 3p", from: 11, to: 15 },
  { key: "afternoon", label: "3p – 6p", from: 15, to: 18 },
  { key: "evening", label: "6p – close", from: 18, to: 24 },
];

const blockOf = (hour: number) =>
  BLOCKS.find((b) => hour >= b.from && hour < b.to)?.key ?? "unknown";

export const blockLabel = (key: string) =>
  BLOCKS.find((b) => b.key === key)?.label ?? "Unknown";

/**
 * Lines into rows.
 *
 * `tenderBySale` comes from a separate `Tender` read over the same receipts —
 * how a suspect transaction was paid for is the question LP asks next, and it
 * is not an exception so it never arrives with them.
 */
export const buildEvidence = (
  lines: TransactionListItem[],
  types: string[],
  tenderBySale: Map<string, string>,
): EvidenceRow[] => {
  const wanted = new Set(types);
  return lines
    .filter((l) => wanted.has(l.sale_type))
    .map((l) => ({
      id: `${l.sale_id}:${l.line_number}`,
      saleId: l.sale_id,
      date: l.sale_date.slice(0, 10),
      time: String(l.sale_start_time ?? ""),
      hour: hourOf(l),
      lane: l.terminal ? String(l.terminal) : "—",
      saleType: l.sale_type,
      item: l.product_description ?? "",
      qty: l.qty ?? 0,
      amount: l.net_sales ?? 0,
      tender: tenderBySale.get(l.sale_id) ?? "—",
      lineNumber: l.line_number,
    }))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.time.localeCompare(b.time) ||
        a.lineNumber - b.lineNumber,
    );
};

/** What a row's value is, per group. */
const valueOf = (row: EvidenceRow, key: FacetKey): string => {
  if (key === "type") return row.saleType;
  if (key === "dow") return WEEKDAY[weekdayOf(row.date)] ?? "—";
  if (key === "time") return blockOf(row.hour);
  if (key === "lane") return row.lane;
  return row.tender;
};

/**
 * Multi-select within a group is OR; across groups it is AND. `skip` leaves
 * one group unapplied, which is what makes its own counts readable.
 */
export const applyFacets = (
  rows: EvidenceRow[],
  facets: FacetState,
  skip?: FacetKey,
): EvidenceRow[] =>
  rows.filter((row) =>
    (Object.keys(facets) as FacetKey[]).every((key) => {
      if (key === skip) return true;
      const chosen = facets[key];
      if (!chosen || chosen.length === 0) return true;
      return chosen.includes(valueOf(row, key));
    }),
  );

const GROUPS: { key: FacetKey; label: string }[] = [
  { key: "type", label: "Exception type" },
  { key: "dow", label: "Day of week" },
  { key: "time", label: "Time of day" },
  { key: "lane", label: "Lane" },
  { key: "tender", label: "Tender" },
];

const labelFor = (key: FacetKey, value: string) =>
  key === "time" ? blockLabel(value) : key === "lane" ? `Lane ${value}` : value;

const sortValues = (key: FacetKey, values: FacetValue[]) => {
  if (key === "type")
    return values.sort((a, b) => typeOrder(a.value) - typeOrder(b.value));
  if (key === "dow")
    return values.sort(
      (a, b) => WEEKDAY.indexOf(a.value) - WEEKDAY.indexOf(b.value),
    );
  if (key === "time")
    return values.sort(
      (a, b) =>
        BLOCKS.findIndex((x) => x.key === a.value) -
        BLOCKS.findIndex((x) => x.key === b.value),
    );
  return values.sort((a, b) => b.count - a.count);
};

export const buildFacets = (
  rows: EvidenceRow[],
  facets: FacetState,
): FacetGroup[] =>
  GROUPS.map(({ key, label }) => {
    // Every filter EXCEPT this group's own — see the note at the top.
    const pool = applyFacets(rows, facets, key);
    const tally = new Map<string, number>();
    for (const row of pool) {
      const v = valueOf(row, key);
      tally.set(v, (tally.get(v) ?? 0) + 1);
    }
    // A value that is currently selected must stay listed even when the other
    // groups have narrowed it to nothing, or it becomes impossible to unpick.
    for (const v of facets[key] ?? []) if (!tally.has(v)) tally.set(v, 0);

    return {
      key,
      label,
      values: sortValues(
        key,
        [...tally.entries()].map(([value, count]) => ({
          value,
          label: labelFor(key, value),
          count,
          swatch: key === "type" ? hueFor(value) : undefined,
        })),
      ),
    };
  }).filter((g) => g.values.length > 0);
