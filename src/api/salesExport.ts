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

export interface ExportPreviewResp {
  error: number;
  success: boolean;
  stores: ExportStore[];
  storeids: number[];
  saleTypes: string[];
  columns: ExportColumn[];
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
export interface ExportParams {
  startDate: string;
  endDate: string;
  storeids: number[];
  columns: string[] | null;
  saleTypes: string[] | null;
  excludeVoids: boolean;
  fileFormat: string;
  filePrefix: string | null;
  ordered: boolean;
  dryRun: boolean;
}

export const runExport = (url: string, token: string, params: ExportParams) =>
  post(url, token, "sales/export", params);
