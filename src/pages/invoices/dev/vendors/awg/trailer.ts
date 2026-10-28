import type { ParsedRecord } from "../../core/types";
import { AWG_RECORD } from "./schema";

/**
 * Whether the file arrived whole.
 *
 * A `99` trailer's `rec_cnt` is how many records its extract wrote, the
 * trailer itself excluded. A file can be several extracts merged: the sample
 * holds eight, made a minute apart, with their records re-sorted together and
 * all eight trailers gathered at the end. So no trailer marks where its own
 * records stop — but their counts together must equal the records in the file,
 * and in the sample they do, exactly.
 *
 * Nothing else can tell a complete file from a truncated one. Invoices
 * reconcile against their own `19` totals, so a file cut off between two
 * invoices loses whole invoices and still looks clean. A cut that takes the
 * trailers with it leaves none; one that drops records leaves a count higher
 * than what arrived.
 *
 * Blank lines — stray padding between records — are not records and are not
 * counted.
 */

export interface TrailerCheck {
  ok: boolean;
  /** How many `99` records the file carries. */
  trailers: number;
  /** What the trailers together say the file holds. */
  expected: number;
  /** What it holds. */
  found: number;
}

export const checkTrailers = (records: ParsedRecord[]): TrailerCheck => {
  let trailers = 0;
  let expected = 0;
  let found = 0;

  for (const record of records) {
    if (record.raw.trim() === "") continue;
    if (record.recordType === AWG_RECORD.fileTrailer) {
      trailers += 1;
      const count = record.fields.rec_cnt;
      expected += typeof count === "number" ? count : 0;
    } else {
      found += 1;
    }
  }

  return {
    ok: trailers > 0 && expected === found,
    trailers,
    expected,
    found,
  };
};
