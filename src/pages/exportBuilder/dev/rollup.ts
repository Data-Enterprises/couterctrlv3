import type {
  ExportAggregate,
  ExportColumn,
  ExportRow,
} from "../../../api/salesExport";
import { aliasFor, isNumericType } from "./aggregates";

/** One measure: a column (or `*`) and what to do with it. */
export type Measure = ExportAggregate;

export interface RollupSpec {
  groupBy: string[];
  aggregates: Measure[];
  /** The table's columns, for their types: min and max on a varchar are
   *  lexicographic on the endpoint, and have to be here too. */
  columns: ExportColumn[];
  /** The endpoint sorts an aggregated export by its group keys. */
  ordered: boolean;
}

/** SQL counts values, not rows: a null is not a value. */
const isMissing = (v: unknown) => v === null || v === undefined || v === "";

interface Bucket {
  keys: (string | number | boolean | null)[];
  sums: number[];
  counts: number[];
  mins: (string | number | null)[];
  maxes: (string | number | null)[];
  distinct: Set<string>[];
  rows: number;
}

/**
 * The sample, rolled up the way the endpoint would roll up the range.
 *
 * This is a preview of a SHAPE, not of the numbers: fifty lines cannot stand
 * in for a month, and the screen says so. What it does show truthfully is the
 * file's columns, their names — `total_sales_sum`, the endpoint's own spelling
 * — and which group keys the data actually produces, including the null one
 * the tender lines fall into.
 *
 * The arithmetic still matches the endpoint's, so the shape is right for the
 * right reason: counts ignore nulls, count(*) does not, avg divides by the
 * values it actually had, and min/max compare numerically only where the
 * column is a number.
 */
export const rollupSampleRows = (rows: ExportRow[], spec: RollupSpec) => {
  const { groupBy, aggregates, columns } = spec;
  const outputColumns = [
    ...groupBy,
    ...aggregates.map((a) => aliasFor(a.column, a.fn)),
  ];

  if (groupBy.length === 0 || aggregates.length === 0) {
    return { columns: outputColumns, rows: [] as ExportRow[] };
  }

  const numeric = aggregates.map(
    (a) =>
      a.column !== "*" &&
      isNumericType(
        columns.find((c) => c.name === a.column)?.data_type ?? "",
      ),
  );

  const buckets = new Map<string, Bucket>();

  for (const row of rows) {
    const keys = groupBy.map((c) => {
      const v = row[c];
      return v === undefined ? null : v;
    });
    const id = JSON.stringify(keys);
    let bucket = buckets.get(id);
    if (!bucket) {
      bucket = {
        keys,
        sums: aggregates.map(() => 0),
        counts: aggregates.map(() => 0),
        mins: aggregates.map(() => null),
        maxes: aggregates.map(() => null),
        distinct: aggregates.map(() => new Set<string>()),
        rows: 0,
      };
      buckets.set(id, bucket);
    }
    bucket.rows += 1;

    aggregates.forEach((agg, i) => {
      if (agg.column === "*") return;
      const raw = row[agg.column];
      if (isMissing(raw)) return;
      bucket.counts[i] += 1;
      bucket.distinct[i].add(String(raw));
      const asNumber = Number(raw);
      if (!Number.isNaN(asNumber)) bucket.sums[i] += asNumber;
      // Compared as the column is stored, which is what decides whether "9"
      // sorts above "10".
      const value = numeric[i] ? asNumber : String(raw);
      const low = bucket.mins[i];
      const high = bucket.maxes[i];
      if (low === null || value < low) bucket.mins[i] = value;
      if (high === null || value > high) bucket.maxes[i] = value;
    });
  }

  const out: ExportRow[] = [];
  for (const bucket of buckets.values()) {
    const row: ExportRow = {};
    groupBy.forEach((c, i) => {
      row[c] = bucket.keys[i];
    });
    aggregates.forEach((agg, i) => {
      const alias = aliasFor(agg.column, agg.fn);
      if (agg.column === "*") {
        row[alias] = bucket.rows;
        return;
      }
      switch (agg.fn) {
        case "sum":
          row[alias] = bucket.sums[i];
          break;
        case "avg":
          // Four places: the sample is an illustration, and sixteen digits of
          // floating point in a preview cell is noise.
          row[alias] =
            bucket.counts[i] === 0
              ? null
              : Math.round((bucket.sums[i] / bucket.counts[i]) * 1e4) / 1e4;
          break;
        case "count":
          row[alias] = bucket.counts[i];
          break;
        case "count_distinct":
          row[alias] = bucket.distinct[i].size;
          break;
        case "min":
          row[alias] = bucket.mins[i];
          break;
        case "max":
          row[alias] = bucket.maxes[i];
          break;
      }
    });
    out.push(row);
  }

  if (spec.ordered) {
    out.sort((a, b) => {
      for (const c of groupBy) {
        const x = a[c];
        const y = b[c];
        if (x === y) continue;
        // Nulls last, as they sort in the file.
        if (x === null) return 1;
        if (y === null) return -1;
        return x < y ? -1 : 1;
      }
      return 0;
    });
  }

  return { columns: outputColumns, rows: out };
};
