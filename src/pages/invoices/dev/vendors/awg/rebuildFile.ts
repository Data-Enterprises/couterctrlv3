import { decodeField } from "../../core/fixedWidth";
import { encodeField, fieldSpan, writeField } from "../../core/encodeField";
import type { FieldSpec, ParsedRecord } from "../../core/types";
import type { AwgInvoice } from "./group";
import { AWG_FILE_SPEC } from "./schema";

/**
 * The file, with the page's corrections written into it.
 *
 * Send uploads a file and the server decodes what it receives, so a file sent
 * as it arrived is a file sent uncorrected — whatever the screen said. This
 * rebuilds it from the corrected invoices.
 *
 * **Every line not corrected is copied through byte for byte**, including
 * record types this page never groups and any line the reader could not
 * parse. Rewriting a line costs nothing and risks everything in a fixed-width
 * file, so the only lines that change are the ones carrying a changed value.
 *
 * **What can travel, and what cannot.** A correction that is a *value* —
 * typed by hand, or a random-weight run's retail split across its lines —
 * lives in a column and goes into the file. The suggested *reading* does not:
 * per-pound cost, per-pound deals and single rounding are how totals are
 * built from the file, not something written in it. Those are the server's
 * own arithmetic to repeat, and `suggestedApplied` on the result says whether
 * the page was reading that way, so a caller can tell the server if it ever
 * grows a flag for it.
 */

export interface RebuiltFile {
  text: string;
  /** Lines actually rewritten. Zero means the upload is the original file. */
  changedLines: number;
  /** Fields that could not be written — too wide for the column, or a value
   *  of the wrong shape. Named so a send can say what it is dropping rather
   *  than quietly sending the old figure. */
  refused: string[];
  /** Whether the page was reading with suggested corrections on. Not in the
   *  file; the caller decides what to do with it. */
  suggestedApplied: boolean;
}

/** Field specs by record type, built once per rebuild. */
const specsFor = (recordType: string): FieldSpec[] =>
  AWG_FILE_SPEC.schemas[recordType]?.fields ?? [];

/** Every record on an invoice, whatever bucket grouping put it in. */
const recordsOf = (invoice: AwgInvoice): ParsedRecord[] => [
  ...invoice.lineItems,
  ...invoice.deals,
  ...invoice.palletAllowances,
  ...invoice.taxes,
  ...invoice.exceptions,
  ...invoice.shipperComponents,
  ...invoice.deliveryCharges,
  ...(invoice.total ? [invoice.total] : []),
];

export const rebuildAwgFile = (
  text: string,
  invoices: AwgInvoice[],
): RebuiltFile => {
  // Split on the line ending the file actually uses, and keep it.
  const ending = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(ending);

  const refused: string[] = [];
  const rewritten = new Map<number, string>();

  for (const invoice of invoices) {
    for (const record of recordsOf(invoice)) {
      // `lineNumber` is 1-indexed in the source file.
      const index = record.lineNumber - 1;
      const original = lines[index];
      // A record whose line is not where it said it was is left alone. This
      // should not happen, and writing to the wrong line would be far worse
      // than not writing at all.
      if (original === undefined || original !== record.raw) continue;

      let line = original;
      for (const field of specsFor(record.recordType)) {
        // The two header corrections live on the INVOICE, not on a record --
        // `editHeader` sets them there -- so they would otherwise never
        // reach the file. Written to every record of that invoice, which is
        // what "this invoice's delivery date is X" means. Records already
        // holding the value are left alone by the comparison below.
        const wanted =
          field.name === "delv_date"
            ? invoice.deliveryDate
            : field.name === "retail_dept"
              ? invoice.retailDept
              : record.fields[field.name];
        if (wanted === undefined) continue;

        // Compare decoded against decoded. The file's own spelling of a value
        // is not unique -- a space-padded id and a zero-padded one decode the
        // same -- so comparing spans would rewrite lines that say exactly
        // what they already say.
        const current = decodeField(line, field);
        if (sameValue(current, wanted)) continue;

        const encoded = encodeField(wanted, field, fieldSpan(line, field));
        if (encoded === null) {
          refused.push(
            `${invoice.invoiceNbr} line ${record.lineNumber}: ${field.name}`,
          );
          continue;
        }
        line = writeField(line, field, encoded);
      }

      if (line !== original) rewritten.set(index, line);
    }
  }

  if (rewritten.size > 0) {
    for (const [index, line] of rewritten) lines[index] = line;
  }

  return {
    text: lines.join(ending),
    changedLines: rewritten.size,
    refused,
    suggestedApplied: invoices.some((invoice) => invoice.suggested === true),
  };
};

/** Decoded values, compared by what they mean rather than by identity —
 *  `Decimal` is a class, so two equal amounts are two objects. */
const sameValue = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  const aDec = a as { units?: bigint; decimals?: number } | null;
  const bDec = b as { units?: bigint; decimals?: number } | null;
  if (
    aDec && bDec &&
    typeof aDec.units === "bigint" &&
    typeof bDec.units === "bigint"
  ) {
    // Scale-insensitive: 24.40 at two places and 24.4000 at four are the same
    // amount, and only one of them is what the column holds.
    const scale = Math.max(aDec.decimals ?? 0, bDec.decimals ?? 0);
    const lift = (d: { units: bigint; decimals: number }) =>
      d.units * 10n ** BigInt(scale - d.decimals);
    return (
      lift(aDec as { units: bigint; decimals: number }) ===
      lift(bDec as { units: bigint; decimals: number })
    );
  }
  return false;
};
