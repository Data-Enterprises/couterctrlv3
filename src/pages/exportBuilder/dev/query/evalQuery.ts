import type { ExportColumn, ExportRow } from "../../../../api/salesExport";
import { isNumericType } from "../aggregates";
import { rollupSampleRows } from "../rollup";
import {
  aggLeaves,
  allColumns,
  bareColumns,
  QueryError,
  type Expr,
  type Literal,
  type Query,
  type ValueExpr,
} from "./parseQuery";
import { aliasFor } from "../aggregates";

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

/** A number, or null for anything that cannot be one. SQL arithmetic on a
 *  null is null, and that is the useful answer here too. */
const asNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

/**
 * One value of the SELECT list, for one output row.
 *
 * `lookup` is where an aggregate's value comes from: the rolled-up row when
 * the query groups, and nothing when it does not. Everything else is ordinary
 * arithmetic with SQL's null rule — a null anywhere in a sum makes the sum
 * null, and dividing by zero is null rather than an error, which is what
 * NULLIF is usually written to produce anyway.
 */
const evaluate = (
  expr: ValueExpr,
  row: ExportRow,
  lookup: (fn: string, column: string) => unknown,
): string | number | boolean | null => {
  switch (expr.kind) {
    case "literal":
      return expr.value;
    case "column": {
      const value = row[expr.name];
      return value === undefined ? null : value;
    }
    case "agg": {
      const value = lookup(expr.fn, expr.column);
      return value === undefined ? null : (value as number | string | null);
    }
    case "neg": {
      const value = asNumber(evaluate(expr.expr, row, lookup));
      return value === null ? null : -value;
    }
    case "binary": {
      const left = asNumber(evaluate(expr.left, row, lookup));
      const right = asNumber(evaluate(expr.right, row, lookup));
      if (left === null || right === null) return null;
      switch (expr.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          // Postgres raises here; this is a scratchpad, and a thrown error
          // in the middle of fifty rows tells you less than a blank cell.
          return right === 0 ? null : left / right;
      }
      return null;
    }
    case "call": {
      const args = expr.args.map((a) => evaluate(a, row, lookup));
      switch (expr.name) {
        case "nullif":
          return args[0] === args[1] ? null : args[0];
        case "coalesce":
          return args.find((a) => a !== null && a !== undefined) ?? null;
        case "abs": {
          const n = asNumber(args[0]);
          return n === null ? null : Math.abs(n);
        }
        case "round": {
          const n = asNumber(args[0]);
          const places = args.length > 1 ? (asNumber(args[1]) ?? 0) : 0;
          if (n === null) return null;
          const factor = 10 ** places;
          return Math.round(n * factor) / factor;
        }
        case "greatest":
        case "least": {
          const numbers = args.map(asNumber).filter((n): n is number => n !== null);
          if (numbers.length === 0) return null;
          return expr.name === "greatest"
            ? Math.max(...numbers)
            : Math.min(...numbers);
        }
      }
      return null;
    }
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
    ...query.select.flatMap((s) => allColumns(s.expr)).filter((c) => c !== "*"),
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

  // Every aggregate in every expression, once each: `sum(qty) * max(price)`
  // is one output column and two things to work out per group.
  const leaves = query.select.flatMap((s) => aggLeaves(s.expr));
  const aggregates = leaves.filter(
    (leaf, i) =>
      leaves.findIndex((o) => o.fn === leaf.fn && o.column === leaf.column) === i,
  );

  if (aggregates.length > 0) {
    const ungrouped = query.select
      .flatMap((s) => bareColumns(s.expr))
      .find((name) => !query.groupBy.includes(name));
    if (ungrouped) {
      throw new QueryError(
        `${ungrouped} has to be in the GROUP BY, or inside a function.`,
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
    // The rollup writes each aggregate under the endpoint's own name; the
    // expressions read them back from there and the query's own names go on
    // the result.
    outColumns = query.select.map((s) => s.alias);
    outRows = rolled.rows.map((row) => {
      const lookup = (fn: string, column: string) =>
        row[aliasFor(column, fn as never)];
      const next: ExportRow = {};
      for (const item of query.select) {
        next[item.alias] = evaluate(item.expr, row, lookup);
      }
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
    // No aggregates: the expressions are per row, so `total_sales - qty`
    // means this line's, not the group's.
    const none = () => null;
    outColumns = query.select.map((s) => s.alias);
    outRows = kept.map((row) => {
      const next: ExportRow = {};
      for (const item of query.select) {
        next[item.alias] = evaluate(item.expr, row, none);
      }
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
