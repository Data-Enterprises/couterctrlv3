/**
 * Reading an uploaded UPC list.
 *
 * Two shapes arrive, both produced by the export modals on Sub Dept Margins and
 * Vendors:
 *
 *   The UPC List preset — one code per row, nothing else.
 *   The graded preset — many columns, one of them a sub department.
 *
 * Both are accepted, and the richer one is worth detecting: knowing which
 * departments the items live in lets the report fetch twelve departments
 * instead of forty. A file with no department column simply costs more, and
 * the entry card says so rather than rejecting it.
 *
 * Pasted text is run through the same parser — a paste is just a file that
 * skipped the disk.
 */

import { normalizeProductCode } from "../../utils/productCode";

export interface ParsedUpload {
  upcs: string[];
  /** Department names named by the file, empty when it didn't carry any. Names,
   *  not ids: the export writes descriptions, and matching those back to ids is
   *  the caller's job once it has the department list. */
  departments: string[];
}

/** A UPC is all digits. Everything in these files that isn't — headers, section
 *  titles, descriptions, dollar figures with a decimal point — falls out here,
 *  which is what lets one parser read a bare list and a 15-column report. */
const isUpc = (token: string) => token.length > 0 && /^\d+$/.test(token);

/**
 * The same code after a trip through a float — "7203096070.0".
 *
 * Some stores return codes this way (see `normalizeProductCode`), so a list
 * exported from one of them carries the decimal, and the all-digits test above
 * rejected every line of it. The file looked like it had simply found no items.
 *
 * Six digits minimum, and only trailing zeros: "100.00" is a dollar figure, and
 * without the floor this would quietly turn a price into a product code.
 */
const isFloatUpc = (token: string) => /^\d{6,}\.0+$/.test(token);

/** Splits a CSV line on commas outside quotes. Descriptions carry commas, so a
 *  naive split would shift every column after the first quoted field. */
const splitCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // A doubled quote inside a quoted field is one literal quote.
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
};

const HEADER_HINTS = ["sub department", "sub dept", "department"];

export const parseUpload = (text: string): ParsedUpload => {
  // A BOM survives Excel round-trips and would glue itself to the first cell,
  // where it defeats the all-digits test on the very first UPC.
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);

  const upcs: string[] = [];
  const seenUpc = new Set<string>();
  const departments: string[] = [];
  const seenDept = new Set<string>();
  /** Which column holds the department, once a header row has named it. The
   *  bundled export stacks several sections in one file, so this is re-read
   *  whenever a new header appears rather than fixed from the first line. */
  let deptCol = -1;

  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = splitCsvLine(line);

    const headerAt = cells.findIndex((c) =>
      HEADER_HINTS.includes(c.toLowerCase()),
    );
    if (headerAt !== -1) {
      deptCol = headerAt;
      continue;
    }

    // The first all-digit cell is the UPC. Scanning rather than assuming a
    // column keeps the bare list and the graded report on the same path, and
    // it survives someone reordering columns in Excel before uploading.
    const raw = cells.find((c) => isUpc(c) || isFloatUpc(c));
    if (!raw) continue;
    // Stored in one spelling regardless of which store exported the file — the
    // codes are about to be joined against sales and receiving rows.
    const upc = normalizeProductCode(raw);
    if (!seenUpc.has(upc)) {
      seenUpc.add(upc);
      upcs.push(upc);
    }

    if (deptCol >= 0) {
      const dept = cells[deptCol];
      if (dept && !isUpc(dept) && !seenDept.has(dept)) {
        seenDept.add(dept);
        departments.push(dept);
      }
    }
  }

  return { upcs, departments };
};
