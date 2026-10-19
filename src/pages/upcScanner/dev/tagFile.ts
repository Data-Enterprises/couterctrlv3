import type { ScanRow } from "../../../features/dev/devUpcScannerSlice";

/**
 * The tag file: what Pangea pulls down to print shelf tags.
 *
 * Two columns, because that is all we were told it needs — a UPC and the store
 * it belongs to. Everything the page knows beyond that (item names, scan
 * times, which rows were corrected) exists to get the right UPCs into this
 * list and is deliberately not in it.
 *
 * Kept pure and in one file because the format is still being settled with
 * Tommy, and a format spread across a component is a format nobody can change.
 */

/** The header row. Dropped by setting this to null if Pangea wants bare rows. */
export const TAG_FILE_HEADER: string | null = "upc,storeid";

/**
 * Which of the two codes goes in the file.
 *
 * OPEN QUESTION — flip this one line once Pangea's side is known.
 *
 * `raw` is the code as printed on the tag, check digit and all. `normalized`
 * is what our own lookup and sales tables are keyed on, after `normalizeUpc`
 * drops the check digit and a leading zero.
 *
 * Defaults to `raw` for a reason that is not a preference: raw can always be
 * normalized later, and normalized can never be turned back into raw — the
 * stripped leading zero makes the original ambiguous. Sending raw keeps both
 * options open on their side; sending normalized closes one for good.
 */
export const TAG_FILE_CODE: "raw" | "normalized" = "raw";

const codeOf = (row: ScanRow) => (TAG_FILE_CODE === "raw" ? row.raw : row.code);

/**
 * The rows, oldest first.
 *
 * The screen holds them newest-first so a scan appears where the clerk is
 * looking; a file reads better in the order the aisle was walked, and reversing
 * here keeps that a presentation detail rather than two orders in the store.
 *
 * No quoting or escaping: both fields are digits by construction — the capture
 * paths only admit digits, and a store id is a number. If a text column is
 * ever added, this needs a real CSV writer rather than a join.
 */
export const tagFileLines = (rows: ScanRow[], storeId: number): string[] =>
  [...rows].reverse().map((row) => `${codeOf(row)},${storeId}`);

export const buildTagFile = (rows: ScanRow[], storeId: number): string => {
  const lines = tagFileLines(rows, storeId);
  // Trailing newline: a file whose last row has no line ending is a row some
  // parsers drop and others keep.
  return [...(TAG_FILE_HEADER ? [TAG_FILE_HEADER] : []), ...lines].join("\n") + "\n";
};

/** Two digits, for a file name that sorts. */
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The file's name.
 *
 * Store, date and time, so a folder of these reads as a history and two
 * batches from one shift cannot collide. Local time on purpose — whoever opens
 * this is looking for the batch they sent after lunch.
 */
export const tagFileName = (storeNumber: string, count: number, at: Date): string =>
  `upcs_${storeNumber}_${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(
    at.getDate(),
  )}_${pad(at.getHours())}${pad(at.getMinutes())}_${count}.csv`;
