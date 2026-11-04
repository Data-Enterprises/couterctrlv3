import axios from "axios";
import {
  EXPORT_TOP_LEVEL_KEYS,
  type ExportFile,
  type ExportFilters,
  type ExportParams,
  type ExportTableKey,
} from "./salesExport";

/**
 * Past builds, and the label on one.
 *
 * A build is the question as it was asked that day: the exact payload, the
 * dates, the stores, the counts and the file, written to a manifest beside
 * the export in S3 and never rewritten. A config is the question — mutable,
 * renameable, and it carries no dates. The two are not the same object and
 * this page keeps them apart.
 *
 * Scope comes from the token: the S3 prefix is built from the caller's own
 * userid, and there is no request field that reaches it on either call.
 */

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: "Bearer " + token,
});

export interface ExportBuild {
  /**
   * Opaque. It reads as prefix, range and stamp, and splitting it on `_` is
   * wrong — the prefix may hold underscores and so does the stamp. Every
   * field in it is a field of this object already; this is a key to hand
   * back to `export/{table}/build_link`, nothing more.
   */
  buildId: string;
  /** ISO-8601 UTC, with microseconds. Convert for display or the list reads
   *  as the future. */
  createdAt: string;
  startDate: string;
  endDate: string;
  storeids: number[];
  storeCount: number;
  /** The config this came from, as it was named when the file was written.
   *  Null for an ad-hoc build. */
  userQueryId: number | null;
  userQueryName: string | null;
  rowsUploaded: number;
  bytesUploaded: number;
  elapsedSeconds: number;
  fileFormat: string;
  /** What produced it. Post this back to rebuild. */
  request: Partial<ExportParams>;
  /** The manifest is there and the data file is not — a lifecycle rule took
   *  it. Show the build, do not offer a dead link. */
  expired: boolean;
  files: ExportFile[];
}

export interface ExportBuildsResp {
  error: number;
  success: boolean;
  count: number;
  total: number;
  limit: number;
  /** The links are minted fresh on every listing and last this long. */
  urlExpiresInMinutes: number;
  builds: ExportBuild[];
}

/**
 * A manifest's request, in the router's shape.
 *
 * One written by the export router carries its filters under `filters`; one
 * written before the move carries them at the top level, beside the rest.
 * Both come back in one list, because the S3 folder did not move, so the old
 * ones are nested here: every top-level field the export takes stays where it
 * is, and anything else is a filter. The page then reads both the same way,
 * by the source's own filter names.
 */
export const nestRequest = (request: unknown): Partial<ExportParams> => {
  if (!request || typeof request !== "object") return { filters: {} };
  const { filters, ...rest } = request as Record<string, unknown> & {
    filters?: ExportFilters;
  };
  const top = new Set<string>(EXPORT_TOP_LEVEL_KEYS);
  const out: Record<string, unknown> = {};
  const loose: ExportFilters = {};
  for (const [key, value] of Object.entries(rest)) {
    if (top.has(key)) out[key] = value;
    else loose[key] = value as ExportFilters[string];
  }
  return { ...out, filters: filters ?? loose } as Partial<ExportParams>;
};

export const listExportBuilds = (
  url: string,
  token: string,
  table: ExportTableKey,
  limit = 50,
) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + `export/${table}/builds`,
    params: { limit },
  }).then((resp) => ({
    ...resp,
    data: {
      ...resp.data,
      builds: (resp.data?.builds ?? []).map((b: ExportBuild) => ({
        ...b,
        request: nestRequest(b.request),
      })),
    },
  }));

export interface BuildLinkResp {
  error: number;
  success: boolean;
  buildId: string;
  userQueryId: number | null;
  userQueryName: string | null;
}

export interface DeleteBuildResp {
  error: number;
  success: boolean;
  filesDeleted: number;
  bytesFreed: number;
  /** The S3 keys removed. The type said `keys`; the endpoint has always sent
   *  `deleted`. */
  deleted: string[];
}

/**
 * Remove a build's files and its manifest.
 *
 * There is no undo and there is nothing to restore: the bucket has versioning
 * off, so there is no delete marker and no previous version. The endpoint
 * cannot soften that, which is why the asking happens here.
 *
 * A 500 is a partial delete that names its counts, and retrying is safe —
 * whatever went is already gone.
 */
export const deleteExportBuild = (
  url: string,
  token: string,
  table: ExportTableKey,
  buildId: string,
) =>
  axios({
    method: "DELETE",
    headers: headers(token),
    url: url + `export/${table}/builds/` + encodeURIComponent(buildId),
  });

/**
 * Attach a saved config to a build that was run ad-hoc, or clear it.
 *
 * Only the manifest changes — two kilobytes of JSON — and the exported file
 * is never touched. A 409 means someone else wrote that manifest since it was
 * read: reload the list and try again rather than forcing it.
 */
export const linkExportBuild = (
  url: string,
  token: string,
  table: ExportTableKey,
  buildId: string,
  userQueryId: number | null,
) =>
  axios({
    method: "POST",
    headers: headers(token),
    url: url + `export/${table}/build_link`,
    data: { buildId, userQueryId },
  });
