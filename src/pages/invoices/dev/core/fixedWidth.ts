import { decodeOverpunch } from "./overpunch";
import type { FieldSpec, FieldValue, RecordSpec } from "./types";

/**
 * Turning a fixed-width line into named values.
 *
 * The only place that converts the vendor's 1-indexed inclusive column numbers
 * into JavaScript's 0-indexed exclusive slice. Keeping that conversion in one
 * expression is what lets a schema be transcribed straight from a spec sheet
 * and checked back against it later without mental arithmetic.
 */

/** yyyymmdd → yyyy-mm-dd, or null when the field is unset.
 *
 *  These layouts write an absent date as blanks or all zeros, and both have to
 *  read as "no date" rather than as the year 0. Anything that isn't eight
 *  digits is rejected the same way — a half-populated date is not a date. */
const decodeDate = (raw: string): string | null => {
  const value = raw.trim();
  if (value === "" || /^0+$/.test(value) || !/^\d{8}$/.test(value)) return null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

export const decodeField = (line: string, field: FieldSpec): FieldValue => {
  const raw = line.slice(field.start - 1, field.end);

  switch (field.type) {
    /** Descriptions are right-padded to their column width. Leading space can
     *  be meaningful in these files, so only the padding comes off. */
    case "text":
      return raw.replace(/\s+$/, "");

    /** Codes, store and invoice numbers. Trimmed both ends and kept as strings
     *  — leading zeros are part of the identifier, and `Number` would eat them. */
    case "id":
      return raw.trim();

    case "int": {
      const value = raw.trim();
      return value === "" ? 0 : Number(value);
    }

    case "signed":
      return decodeOverpunch(raw, field.decimals ?? 0);

    case "date":
      return decodeDate(raw);
  }
};

export const decodeRecord = (
  line: string,
  spec: RecordSpec,
): Record<string, FieldValue> => {
  const out: Record<string, FieldValue> = {};
  for (const field of spec.fields) out[field.name] = decodeField(line, field);
  return out;
};
