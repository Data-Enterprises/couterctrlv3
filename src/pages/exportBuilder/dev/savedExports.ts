import type { UnknownAction } from "@reduxjs/toolkit";
import type { ExportExpr } from "../../../api/salesExport";
import type { SavedConfigPayload } from "../../../api/savedConfigs";

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
  setSelectedSaleTypes,
  setSelectedStoreIds,
  setSelectedSubDepartments,
  setSelectedVendors,
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

/** The configuration, in the shape that goes to S3. */
export const toPayload = (
  config: ExportBuilderState,
): SavedConfigPayload => ({
  v: 1,
  mode: config.mode,
  columns: config.columnOrder.filter((n) => config.selectedColumns.includes(n)),
  columnOrder: config.columnOrder,
  groupBy: config.groupBy,
  aggregates: config.aggregates,
  computed: config.computed,
  orderBy: config.orderBy,
  storeIds: narrowedOr(config.selectedStoreIds, config.stores),
  saleTypes: narrowedOr(config.selectedSaleTypes, config.saleTypes),
  ringTypes: narrowedOr(config.selectedRingTypes, config.itemRingTypes),
  subDepartments: narrowedOr(
    config.selectedSubDepartments,
    config.subDepartments,
  ),
  vendors: narrowedOr(config.selectedVendors, config.vendors),
  cashiers: narrowedOr(config.selectedCashiers, config.cashiers),
  productCodes: config.productCodes,
  productDescriptions: config.productDescriptions,
  flags: { ...config.flags },
});

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

  actions.push(setMode(payload.mode));
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
  const computed = (payload.computed).filter((m) =>
    columnsUnder(m.expr).every((name) =>
      config.columns.some((c) => c.name === name),
    ),
  );
  if (computed.length < (payload.computed).length) {
    missing.push(
      `${(payload.computed).length - computed.length} computed measure(s) built on columns this table does not have`,
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
  actions.push(
    setSelectedSaleTypes(resolve(payload.saleTypes, config.saleTypes, "sale types")),
  );
  actions.push(
    setSelectedRingTypes(
      resolve(payload.ringTypes, config.itemRingTypes, "ring types"),
    ),
  );
  actions.push(
    setSelectedSubDepartments(
      resolve(
        payload.subDepartments,
        config.subDepartments.map((s) => String(s.sub_department)),
        "sub departments",
      ),
    ),
  );
  actions.push(
    setSelectedVendors(
      resolve(
        payload.vendors,
        config.vendors.map((v) => v.vendor_id),
        "vendors",
      ),
    ),
  );
  actions.push(
    setSelectedCashiers(
      resolve(
        payload.cashiers,
        config.cashiers.map((c) => c.cashier_number),
        "cashiers",
      ),
    ),
  );

  // A sort key is a column of the file, so it survives only as long as the
  // measure or key it names does.
  const sortable = new Set(
    payload.mode === "summary"
      ? [
          ...payload.groupBy,
          ...payload.aggregates.map((m) => m.alias ?? `${m.column}_${m.fn}`),
          ...(payload.computed).map((m) => m.alias),
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
  actions.push(setFlag({ ...payload.flags }));

  // The days are the one thing a saved export never carries: they are
  // absolute, and September's Saturdays are not October's.
  if (config.saleDates.length > 1) {
    missing.push(
      "Days are not saved — this loaded with every day of the open range ticked",
    );
  }

  return { actions, missing };
};

/** One line saying what a saved configuration is, for the list. */
export const describePayload = (payload: SavedConfigPayload) => {
  const bits = [
    payload.mode === "summary"
      ? `Summary by ${payload.groupBy.join(", ") || "nothing"}`
      : `${payload.columns.length} columns`,
    payload.mode === "summary" &&
      (payload.computed.length) > 0 &&
      `${payload.computed.length} computed`,
    payload.saleTypes && `${payload.saleTypes.length} sale types`,
    payload.subDepartments && `${payload.subDepartments.length} sub departments`,
    payload.vendors && `${payload.vendors.length} vendors`,
    payload.cashiers && `${payload.cashiers.length} cashiers`,
    payload.storeIds && `${payload.storeIds.length} stores`,
    payload.productCodes.length > 0 && `${payload.productCodes.length} codes`,
    payload.productDescriptions.length > 0 &&
      `"${payload.productDescriptions.join('", "')}"`,
    payload.flags.voidFlag === 0 && "no voids",
    payload.flags.voidFlag === 1 && "voids only",
    payload.flags.refundFlag === 0 && "no refunds",
    payload.flags.refundFlag === 1 && "refunds only",
  ].filter(Boolean) as string[];
  return bits.join(" · ");
};
