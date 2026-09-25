import axios from "axios";

/**
 * Help pages and release notes, by signed URL.
 *
 * Replaces building a public bucket URL from `VITE_HELP_PAGES_URL_*`. The
 * pages render in a sandboxed cross-origin iframe — a plain navigation with
 * no headers we control — so the only way to authenticate one is a URL that
 * carries its own signature, which is why this is an endpoint rather than a
 * bucket setting.
 *
 * The bucket is public until this is deployed and verified, so the old path
 * keeps working behind it; closing the bucket is the moment that stops.
 */

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: "Bearer " + token,
});

export type HelpEnv = "dev" | "prod";
export type HelpKind = "help" | "release";

export interface HelpPageUrlResp {
  error: number;
  success: boolean;
  name: string;
  env: HelpEnv;
  kind: HelpKind;
  url: string;
  /** Seconds. Re-sign before this lapses — see the note in InfoModal. */
  expires_in: number;
  msg?: string;
}

/**
 * A signed URL for one page.
 *
 * `env` is what you want, not where you are: a level 9 user on the dev app
 * reading a prod page is a real case, so the caller says which.
 *
 * `name` carries no `.html`, no dots and no slashes — the endpoint answers
 * 400 for any of those, and 404 for a page that is not in that environment.
 */
export const getHelpPageUrl = (
  url: string,
  token: string,
  params: { name: string; env: HelpEnv; kind?: HelpKind },
) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "help/page_url",
    params,
  });

export interface HelpRelease {
  name: string;
  bytes: number;
  last_modified: string;
}

export interface HelpReleasesResp {
  error: number;
  success: boolean;
  env: HelpEnv;
  count: number;
  releases: HelpRelease[];
}

/**
 * Every release note in that environment, newest first.
 *
 * Already sorted by name, which is why the files are named by date. Do not
 * re-sort on `last_modified`: that is when the file was uploaded, so a note
 * corrected in November would claim to be the newest release.
 */
export const listHelpReleases = (url: string, token: string, env: HelpEnv) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "help/releases",
    params: { env },
  });

/** The house convention: an unexpected failure comes back as HTTP 200 with
 *  `error: 1`, so the status line alone is not an answer. */
export const helpFailed = (j: { error?: number; success?: boolean }) =>
  j.error !== 0 || j.success === false;
