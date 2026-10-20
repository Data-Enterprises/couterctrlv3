import { Decimal, sumDecimals } from "../../core/Decimal";
import type { FieldSpec, ParsedRecord } from "../../core/types";
import type { AwgInvoice } from "./group";
import { AWG_FILE_SPEC, AWG_RECORD } from "./schema";

/**
 * One correction, made by hand.
 *
 * Deliberately a plain object of strings and a number: these live in Redux, so
 * they have to survive a serialise/restore cycle. The parsed invoices do not —
 * they carry `Decimal` instances — which is why the page keeps the file text
 * and the edits, and re-derives everything else from the pair.
 */
export interface InvoiceEdit {
  /** `${storeNbr}-${invoiceNbr}`, matching `InvoiceRow.id`. */
  docId: string;
  /** `merge` collapses a group of repeated lines into one — see
   *  `findMergeGroups`. It carries the group's AWG code in `field` and its
   *  retail price in `value`. */
  kind: "header" | "line" | "merge";
  /** The schema field name, e.g. `case_qty_billed`. */
  field: string;
  /** Always the raw text the user typed. Coercion happens on apply, so a
   *  stored edit never depends on how the field was typed at the time. */
  value: string;
  /** Index into `lineItems`. Absent on a header edit. */
  rowIndex?: number;
}

/** The eight line columns a user can correct, in the order they are shown. */
export const EDITABLE_LINE_FIELDS = [
  "item_desc",
  "upc_code",
  "item_code_bil",
  "size",
  "case_qty_billed",
  "mbr_case_cost",
  "cost_ext",
  "ba_retail_ext",
] as const;

export type EditableLineField = (typeof EDITABLE_LINE_FIELDS)[number];

/** Header fields a user can correct. Store number is not one of them: it is
 *  half the key invoices are grouped on, so editing it would silently move
 *  lines between invoices. */
export const EDITABLE_HEADER_FIELDS = ["delv_date", "retail_dept"] as const;

export type EditableHeaderField = (typeof EDITABLE_HEADER_FIELDS)[number];

/** Field specs for the billed-item record, by name — the one place that knows
 *  how a typed value has to be coerced. */
const LINE_SPECS: Map<string, FieldSpec> = new Map(
  (AWG_FILE_SPEC.schemas[AWG_RECORD.lineItem]?.fields ?? []).map((spec) => [
    spec.name,
    spec,
  ]),
);

/**
 * A typed string into the value the field actually holds.
 *
 * Money and counts go through `Decimal.parse` rather than `Number`, because
 * every total on the page is derived from these and one float would put the
 * reconciliation a cent out for reasons nobody could find. Throws on anything
 * it cannot read, which is what makes an invalid edit rejectable rather than
 * silently stored as NaN.
 */
const coerce = (field: string, value: string): string | number | Decimal => {
  const spec = LINE_SPECS.get(field);
  if (spec?.type === "signed") return Decimal.parse(value, spec.decimals ?? 0);
  if (spec?.type === "int") {
    const parsed = Number(value.trim());
    if (!Number.isFinite(parsed)) throw new Error(`invalid number: ${value}`);
    return parsed;
  }
  return value;
};

const editHeader = (
  invoice: AwgInvoice,
  field: string,
  value: string,
): AwgInvoice => {
  switch (field) {
    case "delv_date":
      return { ...invoice, deliveryDate: value.trim() === "" ? null : value.trim() };
    case "retail_dept":
      return { ...invoice, retailDept: value };
    default:
      return invoice;
  }
};

const editLine = (
  invoice: AwgInvoice,
  rowIndex: number,
  field: string,
  value: string,
): AwgInvoice => {
  if (rowIndex < 0 || rowIndex >= invoice.lineItems.length) return invoice;
  const coerced = coerce(field, value);
  const lineItems = invoice.lineItems.map((record, index) =>
    index !== rowIndex
      ? record
      : ({
          ...record,
          fields: { ...record.fields, [field]: coerced },
        } as ParsedRecord),
  );
  return { ...invoice, lineItems };
};

/**
 * Lines that are one item billed several times over.
 *
 * Random-weight product (ground beef, pork butts) arrives as one `01` per
 * piece: the same AWG code, no UPC, and each piece's own cost — but every one
 * of them repeating the *group's* extended retail. Summed line by line, that
 * retail is counted once per piece, and the invoice reports a retail total the
 * pieces' count times too high.
 *
 * A group qualifies only when all of it agrees: same AWG code, a UPC of all
 * zeros, and the same retail price and extended retail on every line. Anything
 * less and the lines are not provably one item, so they are left alone.
 */
export interface MergeGroup {
  itemCode: string;
  retailPrice: string;
  description: string;
  lineCount: number;
  /** What the merged line will carry. */
  cases: string;
  extCost: string;
  extRetail: string;
}

const NO_UPC = /^0+$/;

const fieldText = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

const asDecimal = (value: unknown, decimals: number): Decimal =>
  value instanceof Decimal ? value : Decimal.zero(decimals);

const groupKey = (record: ParsedRecord): string | null =>
  NO_UPC.test(fieldText(record.fields.upc_code))
    ? `${fieldText(record.fields.item_code_bil)}\0${fieldText(
        record.fields.retail_price,
      )}`
    : null;

const mergeable = (lines: ParsedRecord[]): boolean =>
  lines.length > 1 &&
  lines.every(
    (line) =>
      fieldText(line.fields.ba_retail_ext) ===
      fieldText(lines[0].fields.ba_retail_ext),
  );

const linesOf = (
  invoice: AwgInvoice,
  itemCode: string,
  retailPrice: string,
): ParsedRecord[] =>
  invoice.lineItems.filter(
    (line) => groupKey(line) === `${itemCode}\0${retailPrice}`,
  );

export const findMergeGroups = (invoice: AwgInvoice): MergeGroup[] => {
  const groups = new Map<string, ParsedRecord[]>();
  for (const line of invoice.lineItems) {
    const key = groupKey(line);
    if (key === null) continue;
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }

  return [...groups.values()].filter(mergeable).map((lines) => ({
    itemCode: fieldText(lines[0].fields.item_code_bil),
    retailPrice: fieldText(lines[0].fields.retail_price),
    description: fieldText(lines[0].fields.item_desc),
    lineCount: lines.length,
    cases: sumDecimals(
      lines.map((line) => asDecimal(line.fields.case_qty_billed, 0)),
      0,
    ).toString(),
    extCost: sumDecimals(
      lines.map((line) => asDecimal(line.fields.cost_ext, 2)),
      2,
    ).toString(),
    extRetail: fieldText(lines[0].fields.ba_retail_ext),
  }));
};

/**
 * The group, as one line where its first line stood: costs and quantities
 * added up, the shared extended retail taken once. Every other field is the
 * first line's. A group that no longer qualifies — a correction made since
 * changed one of its lines — is left as it is.
 */
const mergeLines = (
  invoice: AwgInvoice,
  itemCode: string,
  retailPrice: string,
): AwgInvoice => {
  const lines = linesOf(invoice, itemCode, retailPrice);
  if (!mergeable(lines)) return invoice;

  const first = lines[0];
  const merged: ParsedRecord = {
    ...first,
    fields: {
      ...first.fields,
      cost_ext: sumDecimals(
        lines.map((line) => asDecimal(line.fields.cost_ext, 2)),
        2,
      ),
      case_qty_billed: sumDecimals(
        lines.map((line) => asDecimal(line.fields.case_qty_billed, 0)),
        0,
      ),
    },
  };

  const absorbed = new Set(lines.slice(1));
  return {
    ...invoice,
    lineItems: invoice.lineItems
      .filter((line) => !absorbed.has(line))
      .map((line) => (line === first ? merged : line)),
  };
};

/**
 * Where the latest merge on an invoice sits in the edit list, or -1.
 *
 * A merge renumbers the lines after it, so a line edit's `rowIndex` means
 * something different either side of one. Edits before it are settled: they
 * are replayed, but not matched, replaced or reverted by anything after.
 */
export const lastMergeIndex = (edits: InvoiceEdit[], docId: string): number => {
  for (let i = edits.length - 1; i >= 0; i -= 1) {
    if (edits[i].docId === docId && edits[i].kind === "merge") return i;
  }
  return -1;
};

/**
 * Every correction, applied over the freshly parsed file.
 *
 * Nothing is recomputed across fields. Changing Qty does **not** re-derive Ext
 * cost, because the job here is to correct what the file *says*, not to
 * recalculate the invoice — and a recomputed column would quietly erase the
 * disagreement the reconciliation exists to surface. What does change is that
 * the invoice totals and the four checks are derived downstream from these
 * line items, so a correction re-runs them for free.
 *
 * An edit that cannot be coerced is dropped and the invoice is returned
 * untouched, the same way the field itself refuses the value: a rejected edit
 * must never leave the page holding a number nobody typed.
 */
export const applyEdits = (
  invoices: AwgInvoice[],
  edits: InvoiceEdit[],
): AwgInvoice[] => {
  if (edits.length === 0) return invoices;

  const byId = new Map(
    invoices.map((invoice) => [
      `${invoice.storeNbr}-${invoice.invoiceNbr}`,
      invoice,
    ]),
  );

  for (const edit of edits) {
    const current = byId.get(edit.docId);
    if (!current) continue;
    try {
      const next =
        edit.kind === "header"
          ? editHeader(current, edit.field, edit.value)
          : edit.kind === "merge"
            ? mergeLines(current, edit.field, edit.value)
            : editLine(current, edit.rowIndex ?? -1, edit.field, edit.value);
      byId.set(edit.docId, next);
    } catch {
      // Unreadable value — leave the invoice as it was.
    }
  }

  return invoices.map(
    (invoice) =>
      byId.get(`${invoice.storeNbr}-${invoice.invoiceNbr}`) ?? invoice,
  );
};

/** Whether a typed value would be accepted, without applying it. Lets a field
 *  refuse at the keyboard rather than appearing to take a value it drops. */
export const isValidEdit = (field: string, value: string): boolean => {
  try {
    coerce(field, value);
    return true;
  } catch {
    return false;
  }
};
