// Utils
import { rowsToCsv } from "../../../../../utils/csvExport";

// Interfaces
import type { MarkdownItem } from "../../../../../interfaces/markdowns";
import type { MarkdownColumn } from "../../interfaces";

/** The rows as CSV, in the order given, with only the chosen columns. */
export const buildMarkdownsCsv = (rows: MarkdownItem[], columns: MarkdownColumn[]) =>
  rowsToCsv(
    columns.map((c) => c.label),
    rows.map((r) => columns.map((c) => c.csv(r))),
  );

/** The download's name: the scope and the dates, safe for a file system. */
export const markdownsFileName = (scope: string, start: string, end: string) =>
  `markdowns_${scope}_${start}_${end}`.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") + ".csv";
