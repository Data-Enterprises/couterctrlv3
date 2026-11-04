import type {
  ExportAggregate,
  ExportComputed,
  ExportSort,
  ExportTableKey,
} from "./salesExport";
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
 * `project: "sales_export"` (or its table's own label -- see configProject),
 * with the configuration JSON in the `sql` column
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
  v: 2;
  /** The table it exports. */
  source: ExportTableKey;
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
  /**
   * The narrowed lists, by the router's filter name, as values. A list that
   * is null or absent is every one of them.
   */
  filters: Record<string, string[] | null>;
  productCodes: string[];
  productDescriptions: string[];
  /** The row switches, by filter name: null, 0 or 1. */
  rowFlags: Record<string, number | null>;
  /** How the file is written. */
  output: {
    dateFormat?: string;
    fileFormat: string;
    filePrefix: string;
    ordered: boolean;
  };
}

/**
 * The shape every configuration was saved in before the page exported more
 * than sales: one field per sales list, under names of its own, and the
 * void and refund switches among the output flags. Read, never written --
 * see upgradePayload.
 */
export interface SavedConfigPayloadV1 {
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

/**
 * A version 1 configuration as version 2: a sales export, its lists under the
 * router's filter names. Every configuration saved before 2 November 2026 is
 * one of these, and they load exactly as they did.
 */
export const upgradePayload = (
  payload: SavedConfigPayload | SavedConfigPayloadV1,
): SavedConfigPayload => {
  if (payload.v === 2) return payload;
  const { voidFlag, refundFlag, ...output } = payload.flags;
  return {
    v: 2,
    source: "sales",
    mode: payload.mode,
    columns: payload.columns,
    columnOrder: payload.columnOrder,
    groupBy: payload.groupBy,
    aggregates: payload.aggregates,
    computed: payload.computed ?? [],
    orderBy: payload.orderBy ?? [],
    storeIds: payload.storeIds,
    filters: {
      saleTypes: payload.saleTypes,
      itemRingTypes: payload.ringTypes,
      subDepartments: payload.subDepartments,
      vendorIds: payload.vendors,
      cashierNumbers: payload.cashiers?.map(String) ?? null,
      priceTypes: payload.priceTypes ?? null,
    },
    productCodes: payload.productCodes,
    productDescriptions: payload.productDescriptions,
    rowFlags: { voidFlag, refundFlag },
    output,
  };
};

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
    const raw = JSON.parse(row.sql) as SavedConfigPayload | SavedConfigPayloadV1;
    if (!raw || typeof raw !== "object" || (raw.v !== 1 && raw.v !== 2)) return null;
    // A version 2 row has to say what it exports and carry its filters; one
    // that does not is not one of ours, whatever its version says.
    if (raw.v === 2 && (typeof raw.source !== "string" || typeof raw.filters !== "object")) {
      return null;
    }
    const payload = upgradePayload(raw);
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

/**
 * The label a table's configurations are filed under: one list per table.
 *
 * Sales keeps the label it has always had, so every configuration saved
 * before the page exported anything else is still in its list. The others
 * are new labels, and a list for one never holds another's rows.
 */
export const configProject = (table: ExportTableKey) =>
  table === "sales" ? SALES_EXPORT_PROJECT : `${table}_export`;

export const listSavedConfigs = (url: string, token: string, table: ExportTableKey) =>
  listSavedQueries(url, token, configProject(table));

export const createSavedConfig = (
  url: string,
  token: string,
  body: { name: string; description: string | null; payload: SavedConfigPayload },
) =>
  createSavedQuery(url, token, {
    name: body.name,
    description: body.description,
    sql: JSON.stringify(body.payload),
    // Filed by what it exports, so it lands in that table's list.
    project: configProject(body.payload.source),
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
