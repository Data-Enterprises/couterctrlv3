import axios from "axios";
import type { ExportFile, ExportParams } from "./salesExport";

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
   * back to `export_build_link`, nothing more.
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

export const listExportBuilds = (url: string, token: string, limit = 50) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "sales/export_builds",
    params: { limit },
  });

export interface BuildLinkResp {
  error: number;
  success: boolean;
  buildId: string;
  userQueryId: number | null;
  userQueryName: string | null;
}

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
  buildId: string,
  userQueryId: number | null,
) =>
  axios({
    method: "POST",
    headers: headers(token),
    url: url + "sales/export_build_link",
    data: { buildId, userQueryId },
  });
