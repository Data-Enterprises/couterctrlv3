import axios from "axios";

/**
 * The two endpoints behind Sales Export.
 *
 * `export_preview` resolves a scope and describes the data: which stores the
 * search actually covers, which sale types are present in the window, every
 * column the table has, and ten sample rows. Everything the page offers comes
 * from that one response — the page invents no lists of its own.
 *
 * `export` writes the file and answers with links. Nothing streams through the
 * API: RDS writes straight to S3 and the browser downloads from there, so the
 * response is `files[].url` rather than bytes.
 */

const post = (url: string, token: string, path: string, data: unknown) =>
  axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + path,
    data,
  });

/** A store the search resolved to. */
export interface ExportStore {
  storeid: number;
  store_number: string;
  store_name: string;
}

/** One column of the table, as `information_schema` describes it. */
export interface ExportColumn {
  name: string;
  data_type: string;
}

/** A sample row: every column, keyed by column name. */
export type ExportRow = Record<string, string | number | boolean | null>;

/**
 * A sub department present in the window: id to filter on, label to show.
 *
 * `sub_department` arrives as a NUMBER — the column is a bigint and the router
 * hands it back unconverted, whatever the written spec says. Typed as either
 * so nothing here assumes one, and every use goes through String().
 */
export interface ExportSubDepartment {
  sub_department: string | number;
  sub_department_description: string;
}

/**
 * A vendor present in the window.
 *
 * `vendor_id` is text despite looking numeric ("148" and "B3389" both occur),
 * and `vendor_name` is frequently null — the id is the only field that is
 * always there, so it is what the list falls back to showing.
 */
export interface ExportVendor {
  vendor_id: string;
  vendor_name: string | null;
}

/**
 * A cashier present in the window.
 *
 * `cashier_number` is a bigint on the table, unlike `vendor_id` — the filter
 * takes numbers, not text. The name is spelled inconsistently between imports,
 * so the endpoint folds on the number: one window returned 384 distinct
 * (number, name) pairs for 188 actual cashiers.
 */
export interface ExportCashier {
  cashier_number: number;
  cashier_name: string | null;
}

export interface ExportPreviewResp {
  error: number;
  success: boolean;
  stores: ExportStore[];
  storeids: number[];
  saleTypes: string[];
  /** Every filter list holds only what this window actually contains, so no
   *  option in the UI can come back empty. */
  itemRingTypes: string[];
  subDepartments: ExportSubDepartment[];
  vendors: ExportVendor[];
  cashiers: ExportCashier[];
  /**
   * 99, not 102: the preview withholds source_file_uri, source_file_etag and
   * source_version_ts — import bookkeeping, identical down every row. The
   * export still writes them if asked, which is why the page sends its column
   * list explicitly rather than null.
   */
  columns: ExportColumn[];
  /** Up to 50, ~118 KB. Unordered, so they show the file's shape rather than
   *  its variety — often one store and two sale types. */
  rows: ExportRow[];
  hasData: boolean;
  message: string | null;
}

/**
 * Scope is a store or a group, never both — the router answers 400 for both
 * set and for neither, so the page sends exactly one.
 */
export interface ExportPreviewParams {
  startDate: string;
  endDate: string;
  singleStore: number;
  useGroups: number;
  searchValue: number;
}

export const getExportPreview = (
  url: string,
  token: string,
  params: ExportPreviewParams,
) => post(url, token, "sales/export_preview", params);

/** One file the export produced. Usually one, but RDS starts a new part past
 *  ~6 GB, so callers iterate rather than reading `files[0]`. */
export interface ExportFile {
  key: string;
  bytes: number;
  url: string;
}

export interface ExportResp {
  error: number;
  success: boolean;
  files: ExportFile[];
  rowsUploaded: number;
  filesUploaded: number;
  bytesUploaded: number;
  elapsedSeconds: number;
  urlExpiresInMinutes: number;
  bucket: string;
  filePath: string;
  storeids: number[];
}

/**
 * `storeids` comes straight from the preview, so it takes precedence and the
 * scope modes are never consulted here — the page has already resolved which
 * stores it means, including the shared-group rule.
 */
/**
 * The aggregate functions the endpoint will run.
 *
 * Closed on purpose: the name is a key into a dictionary on that side and
 * never reaches the query as text, so anything outside this list is a 400
 * rather than a surprise in the file.
 */
export type AggregateFn =
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "count"
  | "count_distinct";

/** One measure of an aggregated export. `column` is a column name, or `*`
 *  for count(*). */
export interface ExportAggregate {
  column: string;
  fn: AggregateFn;
}

export interface ExportParams {
  startDate: string;
  endDate: string;
  storeids: number[];
  columns: string[] | null;
  /**
   * Roll the lines up instead of writing them out.
   *
   * Both are required together and neither can be sent alongside `columns` —
   * the file becomes the group keys and the measures, so a column list would
   * have nothing to say about it. Null for a line-by-line export.
   *
   * The numbers are the table's own, not a report: raw lines include tender
   * rows, voids, department transfers and untendered modifications, and REFUND
   * is stored positive, so a store total here runs to roughly double what
   * /sales/weekly says for the same window. The measure names carry the
   * operation so a file cannot quietly be read as one.
   */
  groupBy: string[] | null;
  aggregates: ExportAggregate[] | null;
  /** Lower-cased both sides by the endpoint, so casing here does not matter. */
  saleTypes: string[] | null;
  /** Matched as stored — no normalising, because these come straight off the
   *  preview, which reads them from the same column. */
  itemRingTypes: string[] | null;
  /** bigint[] on the endpoint: the numeric id, not the description, and a
   *  number rather than the string the preview returns it as. */
  subDepartments: number[] | null;
  /** `vendorIds`, not `vendors` — and text, despite looking numeric. */
  vendorIds: string[] | null;
  /** `cashierNumbers`, and bigint — the one id on this endpoint that is not
   *  text. */
  cashierNumbers: number[] | null;
  /**
   * Particular days inside the range, as `YYYY-MM-DD`.
   *
   * Not a replacement for startDate/endDate, which stay required and still do
   * the real work: they are what prunes the monthly partitions. This narrows
   * within that window, for someone who wants three Saturdays rather than
   * everything between them.
   */
  saleDates: string[] | null;
  /** Typed or pasted, not chosen from a list — the preview returns no code
   *  catalog, and a window can hold tens of thousands of them. */
  productCodes: string[] | null;
  /**
   * Words to find in `product_description`.
   *
   * Each one is a contains, matched without case — descriptions are written
   * the way a till writes them ("WHOLE MILK GAL", "MILK 2% 1/2GAL"), so an
   * exact match is a filter nobody can use. A line is kept if any of these
   * appears in its description.
   *
   * Sent alongside the codes rather than folded into them: two filters that
   * both narrow, like every other pair on this endpoint.
   */
  productDescriptions: string[] | null;
  /**
   * Null leaves the flag alone, 0 excludes flagged lines, 1 returns only them.
   *
   * Neither is an equality test on the endpoint, and that matters: both
   * columns are nullable across roughly a third of rows, and `refund_flag` is
   * not a boolean — it carries 1, 2 and 9, with 2 the most common marker. The
   * endpoint tests COALESCE(flag, 0) against zero instead, so "only refunds"
   * means every marker rather than the literal 1.
   */
  voidFlag: number | null;
  refundFlag: number | null;
  /**
   * Superseded by `voidFlag: 0`, which is what this page sends.
   *
   * Still accepted by the endpoint for callers written before the flag
   * existed, and `voidFlag` wins if both arrive. Optional here so nothing has
   * to send a switch it no longer uses.
   */
  excludeVoids?: boolean;
  fileFormat: string;
  filePrefix: string | null;
  ordered: boolean;
  dryRun: boolean;
}

export const runExport = (url: string, token: string, params: ExportParams) =>
  post(url, token, "sales/export", params);

/**
 * What `dryRun: true` answers with instead.
 *
 * Same endpoint, same request, same store resolution and column validation —
 * it stops before writing anything and hands back the statement it would have
 * run, and where the file would have gone.
 */
export interface ExportDryRunResp {
  error: number;
  success: boolean;
  dryRun: true;
  bucket: string;
  filePath: string;
  storeids: number[];
  copyOptions: string;
  query: string;
}
