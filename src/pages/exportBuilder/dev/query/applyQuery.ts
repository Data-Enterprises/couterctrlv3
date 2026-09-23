import type { UnknownAction } from "@reduxjs/toolkit";
import {
  setAggregates,
  setColumnOrder,
  setFlag,
  setGroupBy,
  setMode,
  setProductCodes,
  setProductDescriptions,
  setSelectedCashiers,
  setSelectedColumns,
  setSelectedRingTypes,
  setSelectedSaleDates,
  setSelectedSaleTypes,
  setSelectedStoreIds,
  setSelectedSubDepartments,
  setSelectedVendors,
  type ExportBuilderState,
} from "../../../../features/dev/devExportBuilderSlice";
import {
  aggLeaves,
  defaultAlias,
  type Expr,
  type Query,
  type SelectItem,
} from "./parseQuery";

/**
 * How the expression reads, roughly, for saying what was dropped.
 *
 * Not a printer for the language — just enough to name the thing the
 * configuration cannot hold.
 */
const sketch = (item: SelectItem) => {
  const leaves = aggLeaves(item.expr);
  const parts = leaves.map((l) => `${l.fn}(${l.column})`);
  return item.alias + (parts.length ? ` — ${parts.join(" and ")}` : "");
};

export interface ApplyPlan {
  actions: UnknownAction[];
  /** What moved into the configuration, in plain words. */
  applied: string[];
  /** What the configuration cannot express, and is therefore being dropped. */
  leftBehind: string[];
}

/** The filters the configuration actually has, and how a value reaches them. */
type FilterColumn =
  | "storeid"
  | "sale_type"
  | "item_ring_type"
  | "sub_department"
  | "vendor_id"
  | "cashier_number"
  | "sale_date"
  | "product_code"
  | "product_description";

const FILTER_COLUMNS: FilterColumn[] = [
  "storeid",
  "sale_type",
  "item_ring_type",
  "sub_department",
  "vendor_id",
  "cashier_number",
  "sale_date",
  "product_code",
  "product_description",
];

/** Every `col = x` and `col IN (...)` joined by AND, or null if anything else
 *  is in the way. An OR cannot be a set of ticks. */
const andChain = (expr: Expr | null): Expr[] | null => {
  if (!expr) return [];
  if (expr.kind === "and") {
    const left = andChain(expr.left);
    const right = andChain(expr.right);
    return left && right ? [...left, ...right] : null;
  }
  if (expr.kind === "or" || expr.kind === "not") return null;
  return [expr];
};

const describe = (expr: Expr): string => {
  switch (expr.kind) {
    case "cmp":
      return `${expr.column} ${expr.op} ${JSON.stringify(expr.value)}`;
    case "in":
      return `${expr.column} ${expr.negated ? "not in" : "in"} (…)`;
    case "like":
      return `${expr.column} like '${expr.pattern}'`;
    case "between":
      return `${expr.column} between …`;
    case "null":
      return `${expr.column} is ${expr.negated ? "not " : ""}null`;
    default:
      return "part of the WHERE";
  }
};

/** Case-insensitively, because the list is what the data actually holds. */
const pickFrom = (available: string[], wanted: (string | number)[]) => {
  const want = new Set(wanted.map((v) => String(v).toLowerCase()));
  return available.filter((v) => want.has(String(v).toLowerCase()));
};

/**
 * What this query would mean as a configuration.
 *
 * The query itself never becomes the export — the endpoint builds the file
 * from the configuration, from values it validates, and it has never accepted
 * SQL from a browser. This is a translation, and it says out loud which parts
 * of the query did not survive it rather than quietly dropping them.
 */
export const planApply = (
  query: Query,
  config: ExportBuilderState,
): ApplyPlan => {
  const actions: UnknownAction[] = [];
  const applied: string[] = [];
  const leftBehind: string[] = [];

  // --- the shape ----------------------------------------------------------
  //
  // The export builds a measure from a column and a function, so only a
  // SELECT item that IS one aggregate can cross over. `sum(qty) * max(price)`
  // is arithmetic the endpoint has no way to express — the window can work it
  // out, the file cannot hold it, and saying which is which is the point of
  // this list.
  const simple = query.select.filter((s) => s.expr.kind === "agg");
  const computed = query.select.filter(
    (s) => s.expr.kind !== "agg" && aggLeaves(s.expr).length > 0,
  );
  const measures = simple.map((s) => {
    const node = s.expr as Extract<SelectItem["expr"], { kind: "agg" }>;
    return { column: node.column, fn: node.fn };
  });

  if (measures.length > 0 || computed.length > 0) {
    actions.push(setMode("summary"), setGroupBy(query.groupBy), setAggregates(measures));
    applied.push(
      query.groupBy.length > 0
        ? `Summary grouped by ${query.groupBy.join(", ")}, with ${measures.length} measure${measures.length === 1 ? "" : "s"}`
        : `Summary with ${measures.length} measure${measures.length === 1 ? "" : "s"}`,
    );
    if (query.groupBy.length === 0) {
      leftBehind.push(
        "A total over everything with no GROUP BY — the export needs at least one key, so pick one before building",
      );
    }
    for (const item of computed) {
      leftBehind.push(
        `${sketch(item)} — the file's measures are one column and one function, so the arithmetic around them cannot go in it`,
      );
    }
    const renamed = simple.filter((s) => {
      const node = s.expr as Extract<SelectItem["expr"], { kind: "agg" }>;
      return s.alias !== defaultAlias(node.column, node.fn);
    });
    for (const s of renamed) {
      const node = s.expr as Extract<SelectItem["expr"], { kind: "agg" }>;
      leftBehind.push(
        `AS ${s.alias} — the file names this ${defaultAlias(node.column, node.fn)}`,
      );
    }
  } else {
    const names = query.star
      ? config.columns.map((c) => c.name)
      : query.select.flatMap((s) =>
          s.expr.kind === "column" ? [s.expr.name] : [],
        );
    for (const item of query.select) {
      if (item.expr.kind !== "column") {
        leftBehind.push(
          `${item.alias} — a worked-out value, and the file holds columns of the table`,
        );
      }
    }
    actions.push(setMode("lines"), setSelectedColumns(names));
    if (!query.star) {
      // The SELECT order is a column order; the rest keep their places behind.
      actions.push(
        setColumnOrder([
          ...names,
          ...config.columnOrder.filter((n) => !names.includes(n)),
        ]),
      );
    }
    applied.push(
      query.star
        ? "Every column"
        : `${names.length} column${names.length === 1 ? "" : "s"}, in this order`,
    );
    if (query.groupBy.length > 0) {
      leftBehind.push("GROUP BY with nothing to measure — add a measure to make it a summary");
    }
  }

  // --- the filters --------------------------------------------------------
  const chain = andChain(query.where);
  if (chain === null) {
    leftBehind.push(
      "The WHERE, because it uses OR or NOT — the configuration is a set of ticks, which is an AND of choices",
    );
  } else {
    for (const part of chain) {
      const column = "column" in part ? part.column : "";
      const wanted: (string | number)[] =
        part.kind === "cmp" && part.op === "=" && part.value !== null
          ? [part.value as string | number]
          : part.kind === "in" && !part.negated
            ? (part.values.filter((v) => v !== null) as (string | number)[])
            : [];

      // A LIKE on the description is the one pattern the configuration can
      // hold, because that filter is a contains itself. The % marks come off:
      // the filter puts them back.
      if (part.kind === "like" && column === "product_description" && !part.negated) {
        const term = part.pattern.replace(/^%+|%+$/g, "");
        if (term && !term.includes("%") && !term.includes("_")) {
          actions.push(setProductDescriptions([term]));
          applied.push(`Descriptions holding "${term}"`);
          continue;
        }
      }

      // The two flags are switches rather than lists.
      if (column === "void_flag" || column === "refund_flag") {
        const key = column === "void_flag" ? "voidFlag" : "refundFlag";
        if (part.kind === "cmp" && (part.op === "=" || part.op === "!=")) {
          const zero = Number(part.value) === 0;
          const value = part.op === "=" ? (zero ? 0 : 1) : zero ? 1 : 0;
          actions.push(setFlag({ [key]: value }));
          applied.push(
            `${column === "void_flag" ? "Voids" : "Refunds"}: ${value ? "only these" : "excluded"}`,
          );
          continue;
        }
        leftBehind.push(describe(part));
        continue;
      }

      if (!FILTER_COLUMNS.includes(column as FilterColumn) || wanted.length === 0) {
        leftBehind.push(describe(part));
        continue;
      }

      switch (column as FilterColumn) {
        case "storeid": {
          const ids = config.stores
            .map((s) => s.storeid)
            .filter((id) => wanted.some((w) => Number(w) === id));
          if (ids.length === 0) break;
          actions.push(setSelectedStoreIds(ids));
          applied.push(`${ids.length} store${ids.length === 1 ? "" : "s"}`);
          break;
        }
        case "sale_type": {
          const picked = pickFrom(config.saleTypes, wanted);
          if (picked.length === 0) break;
          actions.push(setSelectedSaleTypes(picked));
          applied.push(`Sale types: ${picked.join(", ")}`);
          break;
        }
        case "item_ring_type": {
          const picked = pickFrom(config.itemRingTypes, wanted);
          if (picked.length === 0) break;
          actions.push(setSelectedRingTypes(picked));
          applied.push(`Ring types: ${picked.join(", ")}`);
          break;
        }
        case "sub_department": {
          const picked = pickFrom(
            config.subDepartments.map((s) => String(s.sub_department)),
            wanted,
          );
          if (picked.length === 0) break;
          actions.push(setSelectedSubDepartments(picked));
          applied.push(
            `${picked.length} sub department${picked.length === 1 ? "" : "s"}`,
          );
          break;
        }
        case "vendor_id": {
          const picked = pickFrom(
            config.vendors.map((v) => v.vendor_id),
            wanted,
          );
          if (picked.length === 0) break;
          actions.push(setSelectedVendors(picked));
          applied.push(`${picked.length} vendor${picked.length === 1 ? "" : "s"}`);
          break;
        }
        case "cashier_number": {
          const picked = config.cashiers
            .map((c) => c.cashier_number)
            .filter((n) => wanted.some((w) => Number(w) === n));
          if (picked.length === 0) break;
          actions.push(setSelectedCashiers(picked));
          applied.push(`${picked.length} cashier${picked.length === 1 ? "" : "s"}`);
          break;
        }
        case "sale_date": {
          // sale_date is a timestamp; the day is what the list holds.
          const days = wanted.map((w) => String(w).slice(0, 10));
          const picked = config.saleDates.filter((d) => days.includes(d));
          if (picked.length === 0) break;
          actions.push(setSelectedSaleDates(picked));
          applied.push(`${picked.length} day${picked.length === 1 ? "" : "s"}`);
          break;
        }
        case "product_code": {
          const codes = wanted.map(String);
          actions.push(setProductCodes(codes));
          applied.push(`${codes.length} product code${codes.length === 1 ? "" : "s"}`);
          break;
        }
        case "product_description": {
          // An exact match becomes a contains, which is the only shape the
          // filter has — wider than the query was, so it is said out loud.
          const terms = wanted.map(String);
          actions.push(setProductDescriptions(terms));
          applied.push(`Descriptions holding ${terms.map((t) => `"${t}"`).join(", ")}`);
          leftBehind.push(
            "product_description was an exact match in the query and is a contains in the file",
          );
          break;
        }
      }
    }
  }

  if (query.orderBy.length > 0) {
    leftBehind.push(
      "ORDER BY — the file is sorted by its keys or not at all, which is the Sort switch under Output",
    );
  }
  if (query.limit !== null) {
    leftBehind.push("LIMIT — an export is every row that matches");
  }

  return { actions, applied, leftBehind };
};
