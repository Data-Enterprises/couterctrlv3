import type { AggregateFn, ExportColumn } from "../../../api/salesExport";

export type { AggregateFn };

/**
 * The aggregate functions the endpoint will run, and nothing else.
 *
 * The name is a key into a dictionary on that side, never text that reaches
 * the query — so this list is the whole vocabulary. Anything not here comes
 * back 400 before a file is started.
 */
export const AGGREGATE_FNS: AggregateFn[] = [
  "sum",
  "avg",
  "min",
  "max",
  "count",
  "count_distinct",
];

/** What each one is called on screen. */
export const FN_LABELS: Record<AggregateFn, string> = {
  sum: "Total",
  avg: "Average",
  min: "Lowest",
  max: "Highest",
  count: "Count",
  count_distinct: "Distinct count",
};

/**
 * The types Postgres will add up.
 *
 * Seven columns on this table look numeric and are varchar —
 * cost_plus_percent, points_beginning, points_ending, redeemed_points,
 * member_level, customer_longitude, customer_latitude. Summing one fails
 * inside the export after RDS has started writing, which is why the endpoint
 * refuses it at validation and why the page never offers it.
 */
const NUMERIC_TYPES = new Set([
  "bigint",
  "integer",
  "smallint",
  "numeric",
  "double precision",
  "real",
]);

export const isNumericType = (dataType: string) =>
  NUMERIC_TYPES.has(dataType.toLowerCase());

/** sum and avg need a number; the other four work on anything. */
const NUMERIC_ONLY: AggregateFn[] = ["sum", "avg"];

/**
 * The functions worth offering for one column.
 *
 * `*` is the count(\*) case and takes nothing else. A text column keeps min,
 * max and the two counts — lowest and highest are lexicographic there, which
 * is what the endpoint does too.
 */
export const fnsFor = (column: string, columns: ExportColumn[]) => {
  if (column === "*") return ["count"] as AggregateFn[];
  const type = columns.find((c) => c.name === column)?.data_type ?? "";
  return isNumericType(type)
    ? [...AGGREGATE_FNS]
    : AGGREGATE_FNS.filter((fn) => !NUMERIC_ONLY.includes(fn));
};

/**
 * What the measure is called in the file.
 *
 * Exactly the endpoint's spelling, because this name is what appears in the
 * header of the downloaded file: `total_sales_sum`, not `total_sales`. The
 * operation is in the name so nobody opens the file in Excel and reads an
 * average as a total.
 */
export const aliasFor = (column: string, fn: AggregateFn) =>
  column === "*" ? "row_count" : `${column}_${fn}`;
