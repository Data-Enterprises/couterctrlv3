import type { UnknownAction } from "@reduxjs/toolkit";
import type { ExportExpr } from "../../../api/salesExport";
import type { SavedConfigPayload } from "../../../api/savedConfigs";
import { aliasFor } from "./aggregates";
import type { ExportSource } from "./sources";

import {
  setAggregates,
  setComputed,
  setColumnOrder,
  setOrderBy,
  setFlag,
  setGroupBy,
  setPicks,
  setProductCodes,
  setProductDescriptions,
  setRowFlag,
  setSelectedColumns,
  setSelectedStoreIds,
  type ExportBuilderState,
} from "../../../features/dev/devExportBuilderSlice";

/** Every column an expression reaches, aggregated or not. */
const columnsUnder = (expr: ExportExpr): string[] => {
  switch (expr.kind) {
    case "column":
      return [expr.name];
    case "agg":
      return expr.column === "*" ? [] : [expr.column];
    case "binary":
      return [...columnsUnder(expr.left), ...columnsUnder(expr.right)];
    case "neg":
      return columnsUnder(expr.expr);
    case "call":
      return expr.args.flatMap(columnsUnder);
    default:
      return [];
  }
};

/**
 * A list, as it should be saved.
 *
 * Null when nothing was narrowed. The difference matters a month later: a
 * saved export holding "all forty-one vendors" would quietly exclude the
 * vendors that started trading since, while one holding "every vendor" means
 * every vendor of whatever range it is loaded onto.
 */
const narrowedOr = <T>(picked: T[], available: unknown[]): T[] | null =>
  picked.length === available.length ? null : picked;

/** The configuration, in the shape that is saved. */
export const toPayload = (
  config: ExportBuilderState,
  source: ExportSource,
): SavedConfigPayload => {
  const { dateFormat, fileFormat, filePrefix, ordered } = config.flags;
  return {
    v: 2,
    source: source.key,
    // Kept in the payload for rows written before the shape was read off the
    // configuration; nothing loads it.
    mode: config.groupBy.length > 0 ? "summary" : "lines",
    columns: config.columnOrder.filter((n) => config.selectedColumns.includes(n)),
    columnOrder: config.columnOrder,
    groupBy: config.groupBy,
    aggregates: config.aggregates,
    computed: config.computed,
    orderBy: config.orderBy,
    storeIds: narrowedOr(config.selectedStoreIds, config.stores),
    filters: Object.fromEntries(
      source.lists.map((l) => [
        l.filter,
        narrowedOr(config.picks[l.filter] ?? [], config.lists[l.filter] ?? []),
      ]),
    ),
    productCodes: config.productCodes,
    productDescriptions: config.productDescriptions,
    rowFlags: Object.fromEntries(
      source.flags.map((f) => [f.filter, config.rowFlags[f.filter] ?? null]),
    ),
    output: { dateFormat, fileFormat, filePrefix, ordered },
  };
};

export interface LoadPlan {
  actions: UnknownAction[];
  /** What this range could not honour, in plain words. */
  missing: string[];
}

/**
 * What a saved configuration means for the range that is open now.
 *
 * Everything is intersected with what this range actually holds, because a
 * filter naming a vendor that did not trade this month is not a filter — it
 * is an empty file. What falls out is named: a report that quietly stopped
 * covering two of its five stores is worse than one that says so.
 */
export const planLoad = (
  payload: SavedConfigPayload,
  config: ExportBuilderState,
  source: ExportSource,
): LoadPlan => {
  const actions: UnknownAction[] = [];
  const missing: string[] = [];

  const resolve = <T>(
    saved: T[] | null,
    available: T[],
    what: string,
    show: (value: T) => string = String,
  ) => {
    if (saved === null) return available;
    const kept = available.filter((v) => saved.some((s) => String(s) === String(v)));
    const lost = saved.filter(
      (s) => !available.some((v) => String(s) === String(v)),
    );
    if (lost.length > 0) {
      missing.push(
        `${lost.length} ${what} this range does not have: ${lost
          .slice(0, 4)
          .map(show)
          .join(", ")}${lost.length > 4 ? "…" : ""}`,
      );
    }
    // Everything gone is not a filter, it is an empty file — so the list
    // falls back to all of it and the note above says what happened.
    return kept.length > 0 ? kept : available;
  };

  actions.push(setGroupBy(payload.groupBy.filter((n) =>
    config.columns.some((c) => c.name === n),
  )));
  actions.push(
    setAggregates(
      payload.aggregates.filter(
        (m) => m.column === "*" || config.columns.some((c) => c.name === m.column),
      ),
    ),
  );

  // A computed measure is only as good as the columns underneath it: one
  // built on a column this table no longer has would be an error at build
  // time rather than a missing column in the file.
  const computed = payload.computed.filter((m) =>
    columnsUnder(m.expr).every((name) =>
      config.columns.some((c) => c.name === name),
    ),
  );
  if (computed.length < payload.computed.length) {
    missing.push(
      `${payload.computed.length - computed.length} computed measure(s) built on columns this table does not have`,
    );
  }
  actions.push(setComputed(computed));

  const columns = payload.columns.filter((n) =>
    config.columns.some((c) => c.name === n),
  );
  if (columns.length > 0) {
    actions.push(setSelectedColumns(columns));
    actions.push(setColumnOrder(payload.columnOrder));
  }

  actions.push(
    setSelectedStoreIds(
      resolve(
        payload.storeIds,
        config.stores.map((s) => s.storeid),
        "stores",
      ),
    ),
  );

  /**
   * Every list, intersected with what this range holds.
   *
   * Price types are the case this matters most for: a per-company
   * vocabulary, so a miss there is not a value that has gone but a word
   * another company does not use. A configuration saved against Food Giant
   * carries "Regular"; reopened against a company that says "REG", it would
   * match nothing and write an empty file without a word. The router does not
   * check this -- it would cost a scan and fire late -- so it is checked here,
   * where the list for these stores is already in hand.
   */
  for (const list of source.lists) {
    actions.push(
      setPicks({
        filter: list.filter,
        values: resolve(
          payload.filters[list.filter] ?? null,
          (config.lists[list.filter] ?? []).map((i) => i.value),
          list.noun,
          (value) => (String(value) === "" ? "(none)" : String(value)),
        ),
      }),
    );
  }

  // A sort key is a column of the file, so it survives only as long as the
  // measure or key it names does. Named by aliasFor, the endpoint's own rule:
  // count(*) is `row_count`, and spelling it `*_count` here dropped every
  // saved sort on a row count.
  const sortable = new Set(
    payload.mode === "summary"
      ? [
          ...payload.groupBy,
          ...payload.aggregates.map((m) => m.alias || aliasFor(m.column, m.fn)),
          ...payload.computed.map((m) => m.alias),
        ]
      : payload.columns,
  );
  const orderBy = payload.orderBy.filter((s) => sortable.has(s.key));
  if (orderBy.length < payload.orderBy.length) {
    missing.push(
      "Part of the sort named a column this configuration no longer has",
    );
  }
  actions.push(setOrderBy(orderBy));

  actions.push(setProductCodes(payload.productCodes));
  actions.push(setProductDescriptions(payload.productDescriptions));
  for (const flag of source.flags) {
    actions.push(
      setRowFlag({ filter: flag.filter, value: payload.rowFlags[flag.filter] ?? null }),
    );
  }
  actions.push(setFlag({ ...payload.output }));

  // The days are the one thing a saved export never carries: they are
  // absolute, and September's Saturdays are not October's.
  if (config.days.length > 1) {
    missing.push(
      "Days are not saved — this loaded with every day of the open range ticked",
    );
  }

  return { actions, missing };
};

/** One line saying what a saved configuration is, for the list. */
export const describePayload = (payload: SavedConfigPayload, source: ExportSource) => {
  const flagWords = source.flags.flatMap((f) => {
    const value = payload.rowFlags[f.filter];
    return value === 0 ? [`no ${f.plural}`] : value === 1 ? [`${f.plural} only`] : [];
  });
  const bits = [
    payload.mode === "summary"
      ? `Summary by ${payload.groupBy.join(", ") || "nothing"}`
      : `${payload.columns.length} columns`,
    payload.mode === "summary" &&
      payload.computed.length > 0 &&
      `${payload.computed.length} computed`,
    ...source.lists
      .filter((l) => l.inSummary)
      .map((l) => {
        const values = payload.filters[l.filter];
        return values ? `${values.length} ${l.noun}` : false;
      }),
    payload.storeIds && `${payload.storeIds.length} stores`,
    payload.productCodes.length > 0 && `${payload.productCodes.length} codes`,
    payload.productDescriptions.length > 0 &&
      `"${payload.productDescriptions.join('", "')}"`,
    ...flagWords,
  ].filter(Boolean) as string[];
  return bits.join(" · ");
};
