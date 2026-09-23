import axios from "axios";
import type { ExportAggregate, ExportComputed } from "./salesExport";

/**
 * Saved configurations for Sales Export.
 *
 * Three calls over one JSON file per user in S3 — list, save, remove. The
 * payload is the page's own shape and the API treats it as opaque: it stores
 * what it is given and hands it back, which is what keeps a change to the
 * configuration from being a change to the endpoint.
 *
 * Scope is the token's user. Nothing here takes a userid from the caller,
 * because a saved export is not a thing one user should be able to name
 * another user into.
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

/**
 * What a saved configuration holds.
 *
 * A list is `null` when nothing was narrowed — "every vendor" rather than the
 * forty-one vendors that particular week had. Loading it next month then means
 * every vendor of next month, which is what someone saving a monthly report
 * meant. A list that WAS narrowed is kept by value and intersected on the way
 * back in, and whatever the new range does not hold is reported rather than
 * silently dropped.
 *
 * The dates are deliberately absent. A saved export is a question — the shrink
 * report, the vendor rollup — and the range is whichever one is open when it
 * is loaded. Pinning September into it would make it useless in October.
 */
export interface SavedExportPayload {
  v: 1;
  mode: "lines" | "summary";
  /** Selected columns, in the order the file writes them. */
  columns: string[];
  /** The full order, including columns that are not ticked. */
  columnOrder: string[];
  groupBy: string[];
  aggregates: ExportAggregate[];
  computed?: ExportComputed[];
  storeIds: number[] | null;
  saleTypes: string[] | null;
  ringTypes: string[] | null;
  subDepartments: string[] | null;
  vendors: string[] | null;
  cashiers: number[] | null;
  productCodes: string[];
  productDescriptions: string[];
  flags: {
    voidFlag: number | null;
    refundFlag: number | null;
    fileFormat: string;
    filePrefix: string;
    ordered: boolean;
  };
  /** The scratchpad query this came from, if it came from one. */
  querySql?: string;
}

export interface SavedExport {
  id: string;
  name: string;
  payload: SavedExportPayload;
  created: string;
  updated: string;
}

export interface SavedExportsResp {
  error: number;
  success: boolean;
  configs: SavedExport[];
}

export interface SavedExportResp {
  error: number;
  success: boolean;
  config: SavedExport;
}

export const listSavedExports = (url: string, token: string) =>
  post(url, token, "sales/export_configs", {});

/** `id` null for a new one; the server assigns the id and the timestamps. */
export const saveSavedExport = (
  url: string,
  token: string,
  body: { id: string | null; name: string; payload: SavedExportPayload },
) => post(url, token, "sales/export_config_save", body);

export const removeSavedExport = (url: string, token: string, id: string) =>
  post(url, token, "sales/export_config_delete", { id });
