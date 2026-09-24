import type { ExportBuilderState } from "../../../../features/dev/devExportBuilderSlice";
import type { ExportParams } from "../../../../api/salesExport";
import type { MeasureItem } from "./evalQuery";
import { sketchExpr } from "./sketchExpr";

/**
 * The configuration, written out as the query it is.
 *
 * The panel on the left and the box on the right are two views of one thing,
 * so the box is generated from the ticks rather than typed beside them: tick
 * a vendor and the WHERE grows a line. Editing it and pressing Apply goes the
 * other way, through parseQuery and planApply.
 *
 * What comes out has to survive that round trip, which is the constraint that
 * shapes it — single quotes doubled, a description search written as an OR of
 * ILIKEs that Apply knows how to read back, and nothing in it the parser
 * cannot take.
 */

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

/** A list as SQL: `= 'x'` for one, `in ('x', 'y')` for several. */
const asList = (column: string, values: string[], numeric = false) => {
  const written = values.map((v) => (numeric ? String(v) : quote(v)));
  return written.length === 1
    ? `${column} = ${written[0]}`
    : `${column} in (${written.join(", ")})`;
};

/** True when every one of them is picked, which is not a filter at all. */
const whole = (picked: unknown[], available: unknown[]) =>
  picked.length === available.length;

const whereLines = (config: ExportBuilderState) => {
  const lines: string[] = [];

  if (!whole(config.selectedSaleTypes, config.saleTypes)) {
    lines.push(asList("sale_type", config.selectedSaleTypes));
  }
  if (!whole(config.selectedRingTypes, config.itemRingTypes)) {
    lines.push(asList("item_ring_type", config.selectedRingTypes));
  }
  if (!whole(config.selectedSubDepartments, config.subDepartments)) {
    lines.push(asList("sub_department", config.selectedSubDepartments, true));
  }
  if (!whole(config.selectedVendors, config.vendors)) {
    lines.push(asList("vendor_id", config.selectedVendors));
  }
  if (!whole(config.selectedCashiers, config.cashiers)) {
    lines.push(
      asList("cashier_number", config.selectedCashiers.map(String), true),
    );
  }
  if (!whole(config.selectedPriceTypes, config.priceTypes)) {
    lines.push(asList("price_type", config.selectedPriceTypes));
  }
  if (!whole(config.selectedSaleDates, config.saleDates)) {
    lines.push(asList("sale_date", config.selectedSaleDates));
  }
  if (config.productCodes.length > 0) {
    lines.push(asList("product_code", config.productCodes));
  }
  if (config.productDescriptions.length > 0) {
    // A contains, any of — an OR that Apply reads back as the term list it
    // came from.
    const terms = config.productDescriptions.map(
      (term) => `product_description ilike ${quote(`%${term}%`)}`,
    );
    lines.push(terms.length === 1 ? terms[0] : `(${terms.join(" or ")})`);
  }
  if (config.flags.voidFlag !== null) {
    lines.push(config.flags.voidFlag ? "void_flag <> 0" : "void_flag = 0");
  }
  if (config.flags.refundFlag !== null) {
    lines.push(config.flags.refundFlag ? "refund_flag <> 0" : "refund_flag = 0");
  }

  return lines;
};

/** A measure, as it reads in a SELECT list. */
const measureText = (item: MeasureItem) => {
  const body = sketchExpr(item.expr);
  // `sum(qty) as qty_sum` is noise when that is the name it would get
  // anyway; a name someone chose is not.
  const derived =
    item.expr.kind === "agg" &&
    item.alias ===
      (item.expr.column === "*"
        ? "row_count"
        : `${item.expr.column}_${item.expr.fn}`);
  return derived ? body : `${body} as ${item.alias}`;
};

export const configToQuery = (
  config: ExportBuilderState,
  aggregating: boolean,
  measures: MeasureItem[],
  selectedColumns: string[],
) => {
  const lines: string[] = [];

  if (aggregating) {
    const select = [...config.groupBy, ...measures.map(measureText)];
    lines.push(`select ${select.join(", ") || "*"}`);
  } else if (whole(selectedColumns, config.columns)) {
    lines.push("select *");
  } else {
    lines.push(`select ${selectedColumns.join(", ") || "*"}`);
  }

  const where = whereLines(config);
  if (where.length > 0) lines.push(`where ${where.join("\n  and ")}`);

  if (config.groupBy.length > 0) {
    lines.push(`group by ${config.groupBy.join(", ")}`);
  }

  if (config.orderBy.length > 0) {
    lines.push(
      `order by ${config.orderBy
        .map((s) => `${s.key}${s.desc ? " desc" : ""}`)
        .join(", ")}`,
    );
  }

  return lines.join("\n");
};

/**
 * A past build's payload, written out the same way.
 *
 * The manifest holds what was sent, which is a simpler thing to read than a
 * configuration: a null list already means "every one of them", so there is
 * nothing to compare against. Used to show what a build actually ran, a month
 * after anyone remembers.
 */
export const requestToQuery = (request: Partial<ExportParams>) => {
  const lines: string[] = [];
  const list = (column: string, values: (string | number)[] | null | undefined, numeric = false) =>
    values && values.length > 0 ? asList(column, values.map(String), numeric) : null;

  const measures = [
    ...(request.aggregates ?? []).map((m) => {
      const body =
        m.column === "*" ? "count(*)" : `${m.fn}(${m.column})`;
      const derived =
        m.column === "*" ? "row_count" : `${m.column}_${m.fn}`;
      return !m.alias || m.alias === derived ? body : `${body} as ${m.alias}`;
    }),
    ...(request.computed ?? []).map((c) => `${sketchExpr(c.expr)} as ${c.alias}`),
  ];

  if (request.groupBy?.length || measures.length > 0) {
    lines.push(`select ${[...(request.groupBy ?? []), ...measures].join(", ")}`);
  } else if (request.columns?.length) {
    lines.push(`select ${request.columns.join(", ")}`);
  } else {
    lines.push("select *");
  }

  const where = [
    list("sale_type", request.saleTypes),
    list("item_ring_type", request.itemRingTypes),
    list("sub_department", request.subDepartments, true),
    list("vendor_id", request.vendorIds),
    list("cashier_number", request.cashierNumbers, true),
    list("price_type", request.priceTypes),
    list("sale_date", request.saleDates),
    list("product_code", request.productCodes),
    request.productDescriptions?.length
      ? request.productDescriptions
          .map((term) => `product_description ilike '%${term}%'`)
          .join(" or ")
      : null,
    request.voidFlag === null || request.voidFlag === undefined
      ? null
      : request.voidFlag
        ? "void_flag <> 0"
        : "void_flag = 0",
    request.refundFlag === null || request.refundFlag === undefined
      ? null
      : request.refundFlag
        ? "refund_flag <> 0"
        : "refund_flag = 0",
  ].filter(Boolean) as string[];

  if (where.length > 0) lines.push(`where ${where.join("\n  and ")}`);
  if (request.groupBy?.length) lines.push(`group by ${request.groupBy.join(", ")}`);
  if (request.orderBy?.length) {
    lines.push(
      `order by ${request.orderBy
        .map((s) => `${s.key}${s.desc ? " desc" : ""}`)
        .join(", ")}`,
    );
  }
  return lines.join("\n");
};
