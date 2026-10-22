import { parseFixedWidth } from "../../core/reader";
import type { FieldValue } from "../../core/types";
import { rowsToCsv } from "../../../../../utils/csvExport";
import { AWG_FILE_SPEC, AWG_RECORD } from "./schema";

/**
 * The file's records as CSV, one row per record, exactly as decoded.
 *
 * Raw on purpose: nothing is summed, derived or corrected. The `19` invoice
 * total and the `99` file trailer are left out because they are the vendor's
 * own sums, not records of anything. Corrections made on the page are not
 * applied either — this is what the file says, which is the thing to compare
 * a corrected invoice against.
 *
 * Record types carry different fields, so the columns are the union of them
 * in schema order, and a record leaves blank the columns its type does not
 * have.
 */

const SUMMED: ReadonlySet<string> = new Set([
  AWG_RECORD.invoiceTotal,
  AWG_RECORD.fileTrailer,
]);

/** Signed fields decode to `Decimal`, whose `toString` is the exact canonical
 *  form — never routed through a float. */
const cell = (value: FieldValue | undefined): string | number | null =>
  value !== null && typeof value === "object" ? String(value) : (value ?? null);

export const awgRecordsToCsv = (text: string): string => {
  const schemas = Object.values(AWG_FILE_SPEC.schemas).filter(
    (schema) => !SUMMED.has(schema.code),
  );

  const columns: string[] = [];
  for (const schema of schemas) {
    for (const field of schema.fields) {
      if (!columns.includes(field.name)) columns.push(field.name);
    }
  }

  const { records } = parseFixedWidth(text, AWG_FILE_SPEC);
  const rows = records
    .filter((record) => record.known && !SUMMED.has(record.recordType))
    .map((record) => [
      record.lineNumber,
      record.recordType,
      AWG_FILE_SPEC.schemas[record.recordType]?.name ?? "",
      ...columns.map((name) => cell(record.fields[name])),
    ]);

  return rowsToCsv(
    ["line_number", "record_type", "record_name", ...columns],
    rows,
  );
};
