import axios from "axios";

/**
 * The two endpoints behind the export page, on the export router.
 *
 * `export/{table}/preview` resolves a scope and describes the data: which
 * stores the search actually covers, which sale types are present in the
 * window, every column the table has, and sample rows. Everything the page
 * offers comes from that one response — the page invents no lists of its own.
 *
 * `export/{table}` writes the file and answers with links. Nothing streams
 * through the API: RDS writes straight to S3 and the browser downloads from
 * there, so the response is `files[].url` rather than bytes.
 *
 * These used to be `sales/export_preview` and `sales/export`. The export router
 * removed them, so every call names its table now; the page only exports
 * `sales` so far.
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

/** The tables `export/{table}` serves. Only "sales" is exported so far; the
 *  other three come with the data sources plan. */
export type ExportTableKey = "sales" | "orders" | "invoices" | "markdowns";

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

/** A way of spelling dates in the file, as the endpoint offers them. */
export interface ExportDateFormat {
  value: string;
  label: string;
  example: string;
}

export interface ExportPreviewResp {
  error: number;
  success: boolean;
  table: ExportTableKey;
  stores: ExportStore[];
  storeids: number[];
  /**
   * The table's filter lists, by facet name: what this window actually
   * contains, so no choice in the UI can come back empty. Their shapes vary
   * (bare values, `{value, label}`, id/name pairs), and the source
   * descriptions turn each into choices.
   */
  facets: Record<string, unknown>;
  /** The Output date control is built from this, not from a list of ours. */
  dateFormats: ExportDateFormat[];
  /**
   * 99, not 102: the preview withholds source_file_uri, source_file_etag and
   * source_version_ts — import bookkeeping, identical down every row. The
   * export still writes them if asked, which is why the page sends its column
   * list explicitly rather than null.
   */
  columns: ExportColumn[];
  /**
   * 200 rows, around 520 KB — the payload budget rather than a query cost.
   *
   * Unordered, so they show the file's shape accurately but not its variety:
   * two hundred rows from one scan position is often a handful of stores and
   * a couple of sale types.
   */
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

/** The preview for a table. Its lists come back under `facets`, by name. */
export const getExportPreview = (
  url: string,
  token: string,
  table: ExportTableKey,
  params: ExportPreviewParams,
) => post(url, token, `export/${table}/preview`, params);

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
  /** The build's folder, and the key `export/{table}/build_link` takes. Opaque. */
  buildId: string;
  userQueryId: number | null;
  userQueryName: string | null;
  /**
   * False means the file is there and its manifest is not — so this build
   * will not appear in Previous Builds, and the link in hand is the only way
   * back to it. Worth saying rather than swallowing.
   */
  manifestWritten: boolean;
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

/** The scalar functions an expression may call. Closed, like the
 *  aggregates: the name is a key on the endpoint, never text in a query. */
export const EXPORT_CALLS = [
  "nullif",
  "coalesce",
  "round",
  "abs",
  "greatest",
  "least",
] as const;
export type ExportCall = (typeof EXPORT_CALLS)[number];

/**
 * A measure worked out from other measures, as a tree.
 *
 * Sent as JSON, never as SQL. The endpoint walks this and renders the
 * statement itself — each `column` verified against information_schema and
 * quoted, each `fn` and `name` a key into its own dictionary, each `value`
 * bound — so a client can say what it wants computed without any of its text
 * reaching the query. Same posture as the column list, no new surface.
 *
 * `sum(qty) * (max(price) / nullif(max(price_split), 0))` is one of these,
 * four levels deep.
 */
export type ExportExpr =
  | { kind: "column"; name: string }
  | { kind: "literal"; value: number | string | boolean | null }
  /** `column` is a column name, or `*` for count(*). */
  | { kind: "agg"; fn: AggregateFn; column: string }
  | { kind: "binary"; op: "+" | "-" | "*" | "/"; left: ExportExpr; right: ExportExpr }
  | { kind: "neg"; expr: ExportExpr }
  | { kind: "call"; name: ExportCall; args: ExportExpr[] };

/**
 * One measure of an aggregated export.
 *
 * `column` is a column name, or `*` for count(*). `alias` is what the column
 * is called in the file; without it the endpoint derives one — total_sales_sum
 * — which is right until someone has a name of their own for it.
 */
export interface ExportAggregate {
  column: string;
  fn: AggregateFn;
  alias?: string;
}

/**
 * One key of the file's sort.
 *
 * `key` is a column of the file: a group key or a measure's name when the
 * export is a summary, a selected column when it is the lines. Not an
 * expression — sorting by something the file does not contain is a question
 * about rows nobody can see.
 */
export interface ExportSort {
  key: string;
  desc: boolean;
}

/** A computed measure: a name, and the tree that works it out. */
export interface ExportComputed {
  alias: string;
  expr: ExportExpr;
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
  /**
   * Measures with arithmetic in them, which `aggregates` cannot express.
   *
   * A real query asks for
   * `sum(qty) * (max(price) / nullif(max(price_split), 0)) - sum(total_sales)`
   * in one column. Null when nothing is computed.
   */
  computed: ExportComputed[] | null;
  /**
   * The table's filters, by the router's own names, as the source description
   * lists them.
   *
   * Null or an empty list leaves that filter off. A list filter goes as its
   * values (numbers for a numeric column), a flag as null, 0 or 1. The router
   * refuses a name it does not know, and the request is only ever built from
   * the source's own names.
   */
  filters: ExportFilters;
  /**
   * The file's sort, in order of precedence.
   *
   * Null or empty leaves `ordered` to mean what it always has: the line key
   * for a plain export, the group keys for a summary. A non-empty list is the
   * sort instead, whatever `ordered` says — an explicit answer beats a
   * default, and a caller who sent one has already decided.
   */
  orderBy: ExportSort[] | null;
  /**
   * How dates are spelled in the file.
   *
   * A key from the preview's `dateFormats`, not a pattern — the endpoint owns
   * the vocabulary. Null or `iso` leaves them as COPY writes them.
   *
   * A date-only format flattens the columns that carry a real time
   * (`sale_date_with_time`, `updated_at`); `sale_date` is midnight across the
   * table, so nothing is lost there. Sorting stays chronological whatever is
   * chosen: the endpoint sorts on the column, not on its spelling.
   */
  dateFormat: string | null;
  fileFormat: string;
  /**
   * Names the file and the build's folder in S3.
   *
   * Letters, digits, `-` and `_` only, at most 60 — it sits beside the
   * segment that makes a listing yours, so a dot is a 400 rather than
   * something to special-case. `sales.csv` is not a valid prefix.
   */
  filePrefix: string | null;
  ordered: boolean;
  /**
   * The saved config this build came from, or null for ad-hoc.
   *
   * Checked against the caller's own rows before any work starts, so a
   * config that is not theirs is a 404 rather than a wasted export. It is
   * what puts a name on the build in Previous Builds afterwards.
   */
  userQueryId: number | null;
  dryRun: boolean;
}

/** A filter's value: a list, a flag, or null for off. */
export type ExportFilterValue = string[] | number[] | number | null;

export type ExportFilters = Record<string, ExportFilterValue>;

/** The fields the export takes at the top level of its body. */
export const EXPORT_TOP_LEVEL_KEYS = [
  "startDate",
  "endDate",
  "storeids",
  "columns",
  "groupBy",
  "aggregates",
  "computed",
  "orderBy",
  "dateFormat",
  "fileFormat",
  "filePrefix",
  "ordered",
  "userQueryId",
  "dryRun",
] as const satisfies readonly (keyof ExportParams)[];

// Every field of ExportParams is a top-level field or `filters`. A field added
// to the params and not to that list is a compile error here rather than a
// field that silently never reaches the export.
type Classified = (typeof EXPORT_TOP_LEVEL_KEYS)[number] | "filters";
type MustBeNever<T extends never> = T;
export type EveryParamClassified = MustBeNever<Exclude<keyof ExportParams, Classified>>;

/**
 * The params, in the router's shape, from two allowlists.
 *
 * Built from the top-level list and the source's own filter names rather than
 * by spreading the params, so nothing outside them is ever sent. That matters
 * because the router ignores a top-level field it does not know instead of
 * refusing it: a filter left at the top level would export every row in the
 * stores and dates without an error.
 */
export const toExportBody = (params: ExportParams, filterNames: readonly string[]) => {
  const body: Record<string, unknown> = {};
  for (const key of EXPORT_TOP_LEVEL_KEYS) {
    if (params[key] !== undefined) body[key] = params[key];
  }
  const filters: ExportFilters = {};
  for (const name of filterNames) {
    if (params.filters[name] !== undefined) filters[name] = params.filters[name];
  }
  return { ...body, filters };
};

export const runExport = (
  url: string,
  token: string,
  table: ExportTableKey,
  params: ExportParams,
  filterNames: readonly string[],
) => post(url, token, `export/${table}`, toExportBody(params, filterNames));

/** One table as `GET export/tables` describes it. */
export interface ExportTableInfo {
  key: ExportTableKey;
  description: string;
  dated: boolean;
  dateColumn: string | null;
  filters: { name: string; column: string; kind: string; type: string }[];
  facets: string[];
}

export interface ExportTablesResp {
  error: number;
  success: boolean;
  tables: ExportTableInfo[];
}

/**
 * What the router can export, and the filter names each table takes.
 *
 * Static on the router's side, so read once. The page checks its request's
 * filter names against this before a build, so a name the router would
 * refuse is caught on screen rather than after the wait.
 */
export const getExportTables = (url: string, token: string) =>
  axios({
    method: "GET",
    headers: { Authorization: "Bearer " + token },
    url: url + "export/tables",
  });

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
