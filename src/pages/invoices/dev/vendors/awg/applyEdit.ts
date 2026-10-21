import { Decimal } from "../../core/Decimal";
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
  /** `splitRetail` shares a run of random-weight lines' repeated extended
   *  retail out across them — see `findRetailSplits`. It carries the run's
   *  first line in `rowIndex`, its AWG code in `field` and its extended retail
   *  in `value`, so a run that has since changed is recognised and skipped. */
  kind: "header" | "line" | "splitRetail";
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
 * Random-weight pieces whose lines share one extended retail.
 *
 * Catch-weight product (ground beef, pork butts) arrives as one `01` per piece
 * with `rwi = "Y"`, each with its own cost and weight. The extended retail is
 * not always the piece's own: a run of consecutive pieces can each carry the
 * retail of the whole run, and one item can hold several runs side by side —
 * a ribeye at 231.65 on its own, then eight lines all at 1888.74. Summed line
 * by line, a run's retail is counted once per piece.
 *
 * A run is consecutive lines with the same AWG code, retail price and extended
 * retail. Equal values alone do not say where a run ends: two runs of five
 * ground-beef cases at 650.88 sit back to back as ten identical lines, and two
 * 80 lb cases each truly at 129.60 look like a run of two. The weights do —
 * see `runLengths` — and a "run" of one piece is a line carrying its own
 * retail, which is left alone.
 */
export interface RetailSplitGroup {
  /** Index into `lineItems` of the run's first line — how the edit finds it. */
  rowIndex: number;
  /** The `#` the card shows on the run's first line. */
  firstLine: number;
  itemCode: string;
  description: string;
  lineCount: number;
  /** The run's extended retail, as every line in it repeats it. */
  extRetail: string;
}

const fieldText = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

const asDecimal = (value: unknown, decimals: number): Decimal =>
  value instanceof Decimal ? value : Decimal.zero(decimals);

const runKey = (record: ParsedRecord): string | null =>
  record.fields.rwi === "Y"
    ? [
        record.fields.item_code_bil,
        record.fields.retail_price,
        record.fields.ba_retail_ext,
      ]
        .map(fieldText)
        .join("\0")
    : null;

/** The line at `start` and every line straight after it with the same key —
 *  one run or several, which `runLengths` tells apart. */
const runAt = (lines: ParsedRecord[], start: number): ParsedRecord[] => {
  const key = runKey(lines[start]);
  if (key === null) return [];
  let end = start + 1;
  while (end < lines.length && runKey(lines[end]) === key) end += 1;
  return lines.slice(start, end);
};

/**
 * Lines of equal figures, cut into the runs the figure belongs to.
 *
 * From the first line, pieces are taken while price × their combined weight
 * keeps getting nearer the figure; the nearest is one run, and the next starts
 * after it. Price × weight is only approximate here — the weight field is not
 * the exact catch weight — which is why it only decides where runs end and is
 * never used as a value. With no weight to go on, nothing is cut.
 */
const runLengths = (lines: ParsedRecord[]): number[] => {
  const price = asDecimal(lines[0].fields.retail_price, 2).units;
  const ext = asDecimal(lines[0].fields.ba_retail_ext, 2).units * 100n;
  const weights = lines.map((line) => asDecimal(line.fields.pallet_weight, 2).units);
  if (price === 0n || weights.some((w) => w === 0n)) return lines.map(() => 1);

  const distance = (a: bigint, b: bigint) => (a > b ? a - b : b - a);
  const lengths: number[] = [];
  let start = 0;
  while (start < lines.length) {
    let weight = weights[start];
    let best = distance(ext, price * weight);
    let length = 1;
    while (start + length < lines.length) {
      const next = distance(ext, price * (weight + weights[start + length]));
      if (next >= best) break;
      weight += weights[start + length];
      best = next;
      length += 1;
    }
    lengths.push(length);
    start += length;
  }
  return lengths;
};

export const findRetailSplits = (invoice: AwgInvoice): RetailSplitGroup[] => {
  const lines = invoice.lineItems;
  const groups: RetailSplitGroup[] = [];
  let index = 0;
  while (index < lines.length) {
    const same = runAt(lines, index);
    if (same.length === 0) {
      index += 1;
      continue;
    }
    let at = index;
    for (const length of runLengths(same)) {
      if (length > 1) {
        groups.push({
          rowIndex: at,
          firstLine: at + 1,
          itemCode: fieldText(lines[at].fields.item_code_bil),
          description: fieldText(lines[at].fields.item_desc),
          lineCount: length,
          extRetail: fieldText(lines[at].fields.ba_retail_ext),
        });
      }
      at += length;
    }
    index += same.length;
  }
  return groups;
};

/**
 * `total` cents shared out in proportion to `weights`, adding back to exactly
 * `total`.
 *
 * Each share is floored, and the cents that leaves over go one each to the
 * largest remainders, earliest line first on a tie. Price × weight per line
 * would be the obvious rule, but the weight field is not the exact catch
 * weight — on the sample it reproduces the vendor's figure for one item in
 * thirteen — so the vendor's own total is what gets divided. All weights zero
 * splits evenly.
 */
const apportion = (total: bigint, weights: bigint[]): bigint[] => {
  const basis = weights.some((w) => w > 0n) ? weights : weights.map(() => 1n);
  const sum = basis.reduce((a, b) => a + b, 0n);
  const shares = basis.map((w) => (total * w) / sum);
  const remainders = basis.map((w, i) => ({ i, r: (total * w) % sum }));
  let left = total - shares.reduce((a, b) => a + b, 0n);
  remainders.sort((a, b) => (a.r === b.r ? a.i - b.i : a.r > b.r ? -1 : 1));
  for (const { i } of remainders) {
    if (left === 0n) break;
    shares[i] += 1n;
    left -= 1n;
  }
  return shares;
};

/**
 * The run's extended retail, split across its lines by weight in place of the
 * copy each one carries. Lines, quantities and costs are untouched. The run is
 * found again rather than trusted from when it was offered, so one that no
 * longer exists — a correction made since changed it — is left as it is.
 */
const splitRetail = (
  invoice: AwgInvoice,
  rowIndex: number,
  itemCode: string,
  extRetail: string,
): AwgInvoice => {
  const group = findRetailSplits(invoice).find(
    (candidate) =>
      candidate.rowIndex === rowIndex &&
      candidate.itemCode === itemCode &&
      candidate.extRetail === extRetail,
  );
  if (!group) return invoice;

  const lines = invoice.lineItems;
  const run = lines.slice(rowIndex, rowIndex + group.lineCount);
  const total = asDecimal(run[0].fields.ba_retail_ext, 2);
  const shares = apportion(
    total.units,
    run.map((line) => asDecimal(line.fields.pallet_weight, 2).units),
  );

  return {
    ...invoice,
    lineItems: lines.map((line, index) => {
      const at = index - rowIndex;
      return at >= 0 && at < run.length
        ? ({
            ...line,
            fields: {
              ...line.fields,
              ba_retail_ext: new Decimal(shares[at], total.decimals),
            },
          } as ParsedRecord)
        : line;
    }),
  };
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
          : edit.kind === "splitRetail"
            ? splitRetail(
                current,
                edit.rowIndex ?? -1,
                edit.field,
                edit.value,
              )
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
