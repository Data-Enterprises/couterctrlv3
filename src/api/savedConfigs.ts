import type { ExportAggregate, ExportComputed, ExportSort } from "./salesExport";
import {
  createSavedQuery,
  deleteSavedQuery,
  listSavedQueries,
  updateSavedQuery,
  SALES_EXPORT_PROJECT,
  type SavedQuery,
} from "./savedQueries";

/**
 * Saved configurations, on the same `user_queries` table as everything else.
 *
 * A config is the question: a named, reusable set of choices with no date
 * range in it, because the report is the report whether it runs for September
 * or October. The row is an ordinary `user_queries` row under
 * `project: "sales_export"`, with the configuration JSON in the `sql` column
 * — a column named for what it used to hold. The router stores text and never
 * runs it.
 *
 * The id matters beyond this list: it is what a build carries as
 * `userQueryId`, which is what puts a name on that build a week later.
 */

/**
 * What a saved configuration holds.
 *
 * A list is `null` when nothing was narrowed — "every vendor" rather than the
 * forty-one vendors that particular week had. Loading it next month then
 * means every vendor of next month, which is what someone saving a monthly
 * report meant. A list that WAS narrowed is kept by value and intersected on
 * the way back in.
 *
 * The dates are deliberately absent, for the same reason the contract keeps
 * them off a config: the range is whichever one is open when it is loaded.
 */
export interface SavedConfigPayload {
  v: 1;
  mode: "lines" | "summary";
  /** Selected columns, in the order the file writes them. */
  columns: string[];
  /** The full order, including columns that are not ticked. */
  columnOrder: string[];
  groupBy: string[];
  aggregates: ExportAggregate[];
  computed: ExportComputed[];
  orderBy: ExportSort[];
  storeIds: number[] | null;
  saleTypes: string[] | null;
  ringTypes: string[] | null;
  subDepartments: string[] | null;
  vendors: string[] | null;
  cashiers: number[] | null;
  /**
   * The company's own words, which is why loading one checks them.
   *
   * Optional because rows written before price type existed have none, and a
   * missing list means every one of them — the same as any other.
   */
  priceTypes?: string[] | null;
  productCodes: string[];
  productDescriptions: string[];
  flags: {
    voidFlag: number | null;
    refundFlag: number | null;
    dateFormat?: string;
    fileFormat: string;
    filePrefix: string;
    ordered: boolean;
  };
}

/** A row of the table, with its payload already parsed. */
export interface SavedConfig {
  id: number;
  name: string;
  description: string | null;
  payload: SavedConfigPayload;
  created_at: string;
  updated_at: string;
}

/**
 * A row, read.
 *
 * Returns null rather than throwing for anything that will not parse or does
 * not look like one of ours: the table is shared, and a row someone saved by
 * hand should be skipped quietly rather than breaking the list.
 */
export const parseConfigRow = (row: SavedQuery): SavedConfig | null => {
  try {
    const payload = JSON.parse(row.sql) as SavedConfigPayload;
    if (!payload || typeof payload !== "object" || payload.v !== 1) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      payload,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch {
    return null;
  }
};

export const listSavedConfigs = (url: string, token: string) =>
  listSavedQueries(url, token, SALES_EXPORT_PROJECT);

export const createSavedConfig = (
  url: string,
  token: string,
  body: { name: string; description: string | null; payload: SavedConfigPayload },
) =>
  createSavedQuery(url, token, {
    name: body.name,
    description: body.description,
    sql: JSON.stringify(body.payload),
    project: SALES_EXPORT_PROJECT,
  });

/** Only what is sent changes, so a rename carries the name alone and the
 *  configuration is never re-serialised on the way past. */
export const updateSavedConfig = (
  url: string,
  token: string,
  id: number,
  body: { name?: string; description?: string | null; payload?: SavedConfigPayload },
) =>
  updateSavedQuery(url, token, id, {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.payload !== undefined ? { sql: JSON.stringify(body.payload) } : {}),
  });

export const deleteSavedConfig = deleteSavedQuery;
