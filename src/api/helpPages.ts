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

/* `help/releases` and the release-note shapes lived here. Release notes are
   data in `content/releaseNotes` now — in the repo, shipped with the build —
   so nothing lists them over the wire. The endpoint is still on the API and
   is harmless; it simply has no caller.

   `help/page_url` above is kept for the same reason the phone still reads
   documents from the bucket: the twelve `-mobile` pages have not been written
   as content modules yet. When they are, this file goes with them. */

/** The house convention: an unexpected failure comes back as HTTP 200 with
 *  `error: 1`, so the status line alone is not an answer. */
export const helpFailed = (j: { error?: number; success?: boolean }) =>
  j.error !== 0 || j.success === false;
