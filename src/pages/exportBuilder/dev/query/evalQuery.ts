import type { ExportColumn, ExportRow } from "../../../../api/salesExport";
import { isNumericType } from "../aggregates";
import { rollupSampleRows } from "../rollup";
import { QueryError, type Expr, type Literal, type Query } from "./parseQuery";

export interface QueryResult {
  columns: string[];
  rows: ExportRow[];
  /** Sample rows the WHERE kept, before LIMIT and before grouping. */
  matched: number;
  scanned: number;
  /** Something true and worth saying about the result, or null. */
  note: string | null;
}

/** Nearest column name, for a typo. Cheap and good enough for 99 names. */
const didYouMean = (name: string, columns: ExportColumn[]) => {
  const lower = name.toLowerCase();
  const near = columns
    .map((c) => c.name)
    .find(
      (c) => c.includes(lower) || lower.includes(c) || c.startsWith(lower.slice(0, 4)),
    );
  return near ? `Did you mean ${near}?` : undefined;
};

const columnsIn = (expr: Expr | null): string[] => {
  if (!expr) return [];
  switch (expr.kind) {
    case "and":
    case "or":
      return [...columnsIn(expr.left), ...columnsIn(expr.right)];
    case "not":
      return columnsIn(expr.expr);
    default:
      return [expr.column];
  }
};

/**
 * Compare a stored value against a typed one.
 *
 * Numbers win where both look numeric, so `qty > 2` does not compare "10" to
 * "2" as text. Otherwise it is a string comparison, case-sensitive — which is
 * what Postgres does, and the reason a query that looks right can return
 * nothing. The result says so rather than leaving it a mystery.
 */
const compare = (left: unknown, right: Literal, fold: boolean) => {
  if (left === null || left === undefined || right === null) return null;
  if (typeof right === "number") {
    const asNumber = Number(left);
    return Number.isNaN(asNumber) ? null : asNumber - right;
  }
  if (typeof right === "boolean") {
    return Number(Boolean(left)) - Number(right);
  }
  const a = fold ? String(left).toLowerCase() : String(left);
  const b = fold ? right.toLowerCase() : right;
  return a < b ? -1 : a > b ? 1 : 0;
};

const likeToRegExp = (pattern: string, insensitive: boolean) => {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = escaped.replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(`^${body}$`, insensitive ? "i" : "");
};

const matches = (expr: Expr, row: ExportRow, fold: boolean): boolean => {
  switch (expr.kind) {
    case "and":
      return matches(expr.left, row, fold) && matches(expr.right, row, fold);
    case "or":
      return matches(expr.left, row, fold) || matches(expr.right, row, fold);
    case "not":
      return !matches(expr.expr, row, fold);
    case "null": {
      const value = row[expr.column];
      const isNull = value === null || value === undefined;
      return expr.negated ? !isNull : isNull;
    }
    case "in": {
      const hit = expr.values.some(
        (v) => compare(row[expr.column], v, fold) === 0,
      );
      return expr.negated ? !hit : hit;
    }
    case "like": {
      const value = row[expr.column];
      if (value === null || value === undefined) return false;
      const hit = likeToRegExp(expr.pattern, expr.insensitive || fold).test(
        String(value),
      );
      return expr.negated ? !hit : hit;
    }
    case "between": {
      const low = compare(row[expr.column], expr.low, fold);
      const high = compare(row[expr.column], expr.high, fold);
      const hit = low !== null && high !== null && low >= 0 && high <= 0;
      return expr.negated ? !hit : hit;
    }
    case "cmp": {
      const c = compare(row[expr.column], expr.value, fold);
      // A null compares to nothing — not even to NULL, which is what IS NULL
      // is for. Unknown is not true, so the row falls out either way.
      if (c === null) return false;
      switch (expr.op) {
        case "=":
          return c === 0;
        case "!=":
          return c !== 0;
        case "<":
          return c < 0;
        case "<=":
          return c <= 0;
        case ">":
          return c > 0;
        case ">=":
          return c >= 0;
      }
    }
  }
};

/** True if anything in the WHERE compares text, which is where case bites. */
const comparesText = (expr: Expr | null): boolean => {
  if (!expr) return false;
  switch (expr.kind) {
    case "and":
    case "or":
      return comparesText(expr.left) || comparesText(expr.right);
    case "not":
      return comparesText(expr.expr);
    case "cmp":
      return typeof expr.value === "string";
    case "in":
      return expr.values.some((v) => typeof v === "string");
    case "like":
      return !expr.insensitive;
    default:
      return false;
  }
};

/**
 * Run a parsed query over the sample rows.
 *
 * The arithmetic is the endpoint's — the same rollup the Summary mode uses, so
 * a query that checks out here describes a file that will come back the same
 * shape. The numbers are the sample's, which is the one thing this cannot fix.
 */
export const evalQuery = (
  query: Query,
  rows: ExportRow[],
  columns: ExportColumn[],
): QueryResult => {
  const known = new Map(columns.map((c) => [c.name, c]));

  const referenced = [
    ...query.select.filter((s) => s.column !== "*").map((s) => s.column),
    ...columnsIn(query.where),
    ...query.groupBy,
  ];
  for (const name of referenced) {
    if (!known.has(name)) {
      throw new QueryError(
        `There is no column called ${name}.`,
        didYouMean(name, columns),
      );
    }
  }

  const aggregates = query.select
    .filter((s) => s.fn !== null)
    .map((s) => ({ column: s.column, fn: s.fn! }));
  const plain = query.select.filter((s) => s.fn === null);

  if (aggregates.length > 0) {
    const ungrouped = plain.find((s) => !query.groupBy.includes(s.column));
    if (ungrouped) {
      throw new QueryError(
        `${ungrouped.column} has to be in the GROUP BY, or inside a function.`,
        "A query that mixes one row's value with a total of many has not said which row it means.",
      );
    }
  }

  const kept = query.where
    ? rows.filter((row) => matches(query.where!, row, false))
    : rows;

  let note: string | null = null;
  if (kept.length === 0 && query.where && comparesText(query.where)) {
    const folded = rows.filter((row) => matches(query.where!, row, true));
    if (folded.length > 0) {
      note = `Nothing matched, but ${folded.length} row${
        folded.length === 1 ? " does" : "s do"
      } if case is ignored. Text is compared exactly here, as it is in the database — SALE and Sale are two different values.`;
    }
  }

  let outColumns: string[];
  let outRows: ExportRow[];

  if (aggregates.length > 0) {
    const rolled = rollupSampleRows(kept, {
      groupBy: query.groupBy,
      aggregates,
      columns,
      ordered: false,
    });
    // Back into the names the query asked for: `sum(total_sales) AS total`
    // is called total, not total_sales_sum.
    outColumns = [
      ...query.groupBy,
      ...query.select.filter((s) => s.fn).map((s) => s.alias),
    ];
    let measureAt = 0;
    const renames = query.select
      .filter((s) => s.fn)
      .map((s) => ({ from: rolled.columns[query.groupBy.length + measureAt++], to: s.alias }));
    outRows = rolled.rows.map((row) => {
      const next: ExportRow = {};
      for (const key of query.groupBy) next[key] = row[key];
      for (const { from, to } of renames) next[to] = row[from];
      return next;
    });
  } else if (query.groupBy.length > 0) {
    // GROUP BY with nothing to measure is the distinct combinations.
    outColumns = query.groupBy;
    const seen = new Set<string>();
    outRows = [];
    for (const row of kept) {
      const key = JSON.stringify(query.groupBy.map((c) => row[c] ?? null));
      if (seen.has(key)) continue;
      seen.add(key);
      const next: ExportRow = {};
      for (const c of query.groupBy) next[c] = row[c] ?? null;
      outRows.push(next);
    }
  } else if (query.star) {
    outColumns = columns.map((c) => c.name);
    outRows = kept;
  } else {
    outColumns = query.select.map((s) => s.alias);
    outRows = kept.map((row) => {
      const next: ExportRow = {};
      for (const item of query.select) next[item.alias] = row[item.column] ?? null;
      return next;
    });
  }

  if (query.orderBy.length > 0) {
    const keys = query.orderBy.map(({ key, desc }) => {
      if (typeof key === "number") {
        const name = outColumns[key - 1];
        if (!name) {
          throw new QueryError(
            `ORDER BY ${key} points past the end: there ${
              outColumns.length === 1 ? "is 1 column" : `are ${outColumns.length} columns`
            }.`,
          );
        }
        return { name, desc };
      }
      if (!outColumns.includes(key)) {
        throw new QueryError(
          `ORDER BY ${key} is not one of the columns this query returns.`,
          `It returns: ${outColumns.join(", ")}.`,
        );
      }
      return { name: key, desc };
    });
    const numeric = new Map(
      outColumns.map((name) => [
        name,
        isNumericType(known.get(name)?.data_type ?? "") || !known.has(name),
      ]),
    );
    outRows = [...outRows].sort((a, b) => {
      for (const { name, desc } of keys) {
        const x = a[name];
        const y = b[name];
        if (x === y) continue;
        // Nulls last whichever way it is sorted, as Postgres does by default
        // for ascending — and the useful reading either way.
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        const order = numeric.get(name)
          ? Number(x) - Number(y)
          : String(x) < String(y)
            ? -1
            : 1;
        if (order !== 0) return desc ? -order : order;
      }
      return 0;
    });
  }

  const matched = aggregates.length > 0 || query.groupBy.length > 0
    ? kept.length
    : outRows.length;

  if (query.limit !== null) outRows = outRows.slice(0, query.limit);

  return {
    columns: outColumns,
    rows: outRows,
    matched,
    scanned: rows.length,
    note,
  };
};
