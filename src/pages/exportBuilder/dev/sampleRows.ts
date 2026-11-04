import type { ExportRow } from "../../../api/salesExport";
import type { ExportBuilderState } from "../../../features/dev/devExportBuilderSlice";
import { normalizeProductCode } from "./productCodes";
import type { ExportSource, ListMatch } from "./sources";

/**
 * The row filters, as the sample applies them: each the column it narrows
 * and what is picked, read off the source description.
 */
export interface RowFilters {
  lists: { column: string; match: ListMatch; chosen: string[] }[];
  /** `YYYY-MM-DD`, compared against the day part of the column. */
  days: { column: string; chosen: string[] };
  /** Empty means every code, not none: this list is typed, not chosen. */
  codes: { column: string; codes: string[] };
  /** Words to find in the description; empty means every product. */
  descriptions: { column: string; terms: string[] };
  /** Null leaves the flag alone, 0 drops flagged rows, 1 keeps only them. */
  flags: { column: string; want: number | null }[];
}

/** The filters on screen, for the sample. */
export const rowFiltersFor = (
  source: ExportSource,
  config: Pick<
    ExportBuilderState,
    "picks" | "selectedDays" | "productCodes" | "productDescriptions" | "rowFlags"
  >,
): RowFilters => ({
  lists: source.lists.map((l) => ({
    column: l.column,
    match: l.match,
    chosen: config.picks[l.filter] ?? [],
  })),
  days: { column: source.days.column, chosen: config.selectedDays },
  codes: { column: source.codes.column, codes: config.productCodes },
  descriptions: { column: source.descriptions.column, terms: config.productDescriptions },
  flags: source.flags.map((f) => ({
    column: f.column,
    want: config.rowFlags[f.filter] ?? null,
  })),
});

/**
 * One flag column, read the way the endpoint reads it.
 *
 * COALESCE(flag, 0) against zero rather than an equality test: a third of
 * rows are null in both columns, and refund_flag carries 1, 2 and 9 — so
 * "only refunds" has to mean any marker rather than the literal 1.
 */
const keepsFlag = (want: number | null, value: unknown) => {
  if (want === null) return true;
  const flagged = Number(value ?? 0) !== 0;
  return want ? flagged : !flagged;
};

/**
 * Kept if the row's value is one of the chosen.
 *
 * A row whose value the response never offered is left alone rather than
 * silently dropped: a filter can only speak for what it was given.
 *
 * `fold` mirrors what the endpoint does to the column: lower-cased on both
 * sides for an `in_lower` list (sale_type), matched as stored for an `in` one,
 * because those come straight off the preview, which read them from the same
 * columns.
 */
const keeps = (
  chosen: Set<string>,
  value: unknown,
  fold: (s: string) => string = (s) => s,
) => {
  const v = fold(String(value ?? ""));
  return v === "" || chosen.has(v);
};

const lower = (s: string) => s.toLowerCase();

/** One list filter, matched the way the router matches it. */
const keepsList = (
  match: ListMatch,
  chosen: string[],
  value: unknown,
): boolean => {
  if (match === "in_or_blank") {
    // Not `keeps`: an empty value is a value here, so a row holding none is
    // only kept when "" was picked.
    if (chosen.length === 0) return true;
    return chosen.includes(value === null || value === undefined ? "" : String(value));
  }
  if (match === "in_lower") return keeps(new Set(chosen.map(lower)), value, lower);
  return keeps(new Set(chosen.map(String)), value);
};

/**
 * The sample rows the file would hold, given the row filters.
 *
 * The preview returns its two hundred rows before any row filter is applied —
 * it describes the window, not the export — so the same filters have to be
 * applied here. Without it, unticking Tender leaves tender lines sitting in a
 * preview of a file that will not have them.
 *
 * Every one of these reaches the export too, so what narrows the sample
 * narrows the file. They are matched the same way the router matches them,
 * which is the point of doing it here at all.
 */
export const filterSampleRows = (rows: ExportRow[], filters: RowFilters) => {
  const codes = new Set(filters.codes.codes.map(normalizeProductCode));
  const terms = filters.descriptions.terms.map((t) => t.toLowerCase());
  const days = new Set(filters.days.chosen);

  return rows.filter((row) => {
    for (const list of filters.lists) {
      if (!keepsList(list.match, list.chosen, row[list.column])) return false;
    }
    // The day column may be a timestamp, and the router casts it to a date to
    // compare — the first ten characters are that cast.
    if (days.size) {
      const day = String(row[filters.days.column] ?? "").slice(0, 10);
      if (day !== "" && !days.has(day)) return false;
    }
    if (codes.size && !codes.has(normalizeProductCode(row[filters.codes.column]))) {
      return false;
    }
    // A contains, without case: descriptions are written the way a till
    // writes them, so this is the only match anyone can actually use.
    if (terms.length) {
      const description = String(row[filters.descriptions.column] ?? "").toLowerCase();
      if (!terms.some((t) => description.includes(t))) return false;
    }
    for (const flag of filters.flags) {
      if (!keepsFlag(flag.want, row[flag.column])) return false;
    }
    return true;
  });
};
