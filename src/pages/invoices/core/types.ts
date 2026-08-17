/**
 * Vendor-agnostic types for the fixed-width invoice reader.
 *
 * Nothing here knows about AWG or any other format. A vendor supplies record
 * layouts as data — see `vendors/awg/schema.ts` — and the reader in this folder
 * turns a file into records without a single format-specific branch. Adding a
 * vendor should mean adding a schema, never editing `core/`.
 */

/**
 * How one field is read out of a record.
 *
 * `start` and `end` are **1-indexed and inclusive**, matching how the vendor
 * publishes its layout. Converting them to JavaScript's 0-indexed exclusive
 * slice happens in exactly one place (`decodeField`) so the schema can be
 * transcribed from the spec sheet without translation — and checked against it
 * later by someone reading both side by side.
 */
export interface FieldSpec {
  name: string;
  start: number;
  end: number;
  type: FieldType;
  /** Implied decimal places, for `signed` fields. Absent means whole units. */
  decimals?: number;
  /** Human note from the vendor spec, carried for display and debugging. */
  desc?: string;
}

/**
 * `signed` is the one that matters: the field holds digits with its sign folded
 * into the final character (see `overpunch.ts`), and its decimal point is
 * implied rather than written.
 */
export type FieldType = "text" | "id" | "int" | "signed" | "date";

export interface RecordSpec {
  code: string;
  name: string;
  fields: FieldSpec[];
}

export interface FileSpec {
  /** Every record in the file is exactly this long. */
  recordLength: number;
  /** Leading characters that carry the record type. */
  recordTypeLength: number;
  schemas: Record<string, RecordSpec>;
}

/** A decoded field value. `signed` fields decode to `Decimal`, dates to an ISO
 *  string or null, and everything else to a trimmed string or number. */
export type FieldValue = string | number | DecimalLike | null;

/** Structural type so `types.ts` needn't import the class. */
export interface DecimalLike {
  readonly units: bigint;
  readonly decimals: number;
}

export interface ParsedRecord {
  recordType: string;
  /** 1-indexed line number in the source file, for warnings that a human has
   *  to be able to find. */
  lineNumber: number;
  /** False when the file carried a record type the schema doesn't describe.
   *  The raw line is kept either way so nothing is silently discarded. */
  known: boolean;
  fields: Record<string, FieldValue>;
  raw: string;
}

export interface ParseWarning {
  lineNumber: number;
  recordType: string;
  message: string;
}

export interface ParseResult {
  records: ParsedRecord[];
  /** Wrong-length lines and unknown record types. Never thrown — a file with
   *  one bad line should still show the other four hundred. */
  warnings: ParseWarning[];
  countsByType: Record<string, number>;
}
