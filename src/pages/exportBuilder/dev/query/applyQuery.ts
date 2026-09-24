import type { UnknownAction } from "@reduxjs/toolkit";
import {
  setAggregates,
  setComputed,
  setColumnOrder,
  setOrderBy,
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

/** An alias the endpoint will take: an identifier, and its own. */
const USABLE_ALIAS = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;

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
  //
  // A measure that IS one aggregate goes over as one; anything with
  // arithmetic in it goes over as a computed measure, tree and all. Both
  // keep the name they were given, because `AS lossGain` is the difference
  // between a column someone can read and one they have to work out.
  const simple = query.select.filter((s) => s.expr.kind === "agg");
  const computedItems = query.select.filter(
    (s) => s.expr.kind !== "agg" && aggLeaves(s.expr).length > 0,
  );

  const named = (alias: string, fallback: string) => {
    if (alias === fallback) return undefined;
    if (USABLE_ALIAS.test(alias)) return alias;
    leftBehind.push(
      `AS ${alias} — a name in the file has to start with a letter and hold only letters, numbers and underscores, so this one is left to the endpoint`,
    );
    return undefined;
  };

  const measures = simple.map((s) => {
    const node = s.expr as Extract<SelectItem["expr"], { kind: "agg" }>;
    const alias = named(s.alias, defaultAlias(node.column, node.fn));
    return { column: node.column, fn: node.fn, ...(alias ? { alias } : {}) };
  });

  const computed = computedItems
    .filter((s) => {
      if (USABLE_ALIAS.test(s.alias)) return true;
      leftBehind.push(
        `${s.alias} — a computed column needs a name of its own that is a plain identifier`,
      );
      return false;
    })
    .map((s) => ({ alias: s.alias, expr: s.expr }));

  if (measures.length > 0 || computed.length > 0) {
    actions.push(
      setMode("summary"),
      setGroupBy(query.groupBy),
      setAggregates(measures),
      setComputed(computed),
    );
    const counts = [
      `${measures.length} measure${measures.length === 1 ? "" : "s"}`,
      computed.length > 0 &&
        `${computed.length} computed`,
    ]
      .filter(Boolean)
      .join(" and ");
    applied.push(
      query.groupBy.length > 0
        ? `Summary grouped by ${query.groupBy.join(", ")}, with ${counts}`
        : `Summary with ${counts}`,
    );
    if (query.groupBy.length === 0) {
      leftBehind.push(
        "A total over everything with no GROUP BY — the export needs at least one key, so pick one before building",
      );
    }

    /**
     * A key that was grouped by but not selected.
     *
     * SQL lets a query group by something it does not show; a summary export
     * cannot, because the group keys ARE the rows. So the file gets a column
     * the window did not display, and that is worth saying before someone
     * opens the download and finds it.
     */
    const unshown = query.groupBy.filter(
      (key) =>
        !query.select.some(
          (s) => s.expr.kind === "column" && s.expr.name === key,
        ),
    );
    if (unshown.length > 0) {
      applied.push(
        `${unshown.join(", ")} will be ${unshown.length === 1 ? "a column" : "columns"} in the file — a summary writes every key it groups by, even one the query did not select`,
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

  /**
   * The sort, in the file's own names.
   *
   * A query may sort by position — `order by 6` — or by an output name, and
   * both have to land on a column the file actually has. Anything that does
   * not is named rather than dropped: a file sorted by something other than
   * what was asked for looks right and is not.
   */
  if (query.orderBy.length > 0) {
    const outputs = query.star
      ? config.columns.map((c) => c.name)
      : query.select.map((s) => s.alias);

    const sort = query.orderBy
      .map(({ key, desc }) => {
        const name = typeof key === "number" ? outputs[key - 1] : key;
        if (!name || !outputs.includes(name)) {
          leftBehind.push(
            `ORDER BY ${key} — the file does not carry that column, so it cannot be sorted by it`,
          );
          return null;
        }
        return { key: name, desc };
      })
      .filter((s): s is { key: string; desc: boolean } => s !== null);

    if (sort.length > 0) {
      actions.push(setOrderBy(sort));
      applied.push(
        `Sorted by ${sort
          .map((s) => `${s.key}${s.desc ? " (high to low)" : ""}`)
          .join(", ")}`,
      );
    }
  }
  if (query.limit !== null) {
    leftBehind.push("LIMIT — an export is every row that matches");
  }

  return { actions, applied, leftBehind };
};
