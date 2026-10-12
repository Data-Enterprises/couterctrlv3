import { useCallback, useMemo } from "react";
import { useAppSelector } from ".";
import type { HelpKind } from "../api/helpPages";

/**
 * The URL of one help page or release note.
 *
 * TEMPORARY: back on the public bucket, built from `VITE_HELP_PAGES_URL_*`,
 * until `help/page_url` is deployed. The signed-URL version is in git — see
 * "Help pages come from the API, signed, on the click" — and the whole of it
 * lives in this file, so turning it back on is restoring one module. The hook's
 * shape is deliberately unchanged for that reason: callers keep `src`,
 * `problem` and `retry` and do not know which way the URL arrived.
 *
 * The bucket grants anonymous `s3:GetObject` on `dev/` and `prod/`, which is
 * what makes this possible at all — the frame is sandboxed without
 * `allow-same-origin`, so there are no headers to authenticate with and
 * nothing but a public URL can load in it.
 *
 * `problem` is always null here, and that is honest rather than lazy: a
 * cross-origin frame reports nothing about what it loaded, so a missing page
 * renders S3's own error XML inside the frame and this code never hears about
 * it. That is why `constants/helpPages.ts` is a list rather than a probe. The
 * signed version had real errors to report because it made a real request.
 */

/** Which bucket folder, by the flag that already picks the API. */
const baseFor = (apiEnv: string) =>
  apiEnv === "dev"
    ? import.meta.env.VITE_HELP_PAGES_URL_DEV
    : import.meta.env.VITE_HELP_PAGES_URL_PROD;

export const useHelpPageUrl = ({
  name,
  kind = "help",
  section,
  enabled,
}: {
  name: string;
  kind?: HelpKind;
  section?: string;
  enabled: boolean;
}) => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);

  const src = useMemo(() => {
    // An empty src is what stops a closed sheet loading a page nobody asked
    // for, and what makes reopening it re-navigate the frame.
    if (!enabled || !name) return "";

    const base = baseFor(apiEnv);
    if (!base) return "";

    // `release/{env}/{name}.html`, against `{env}/{name}.html` for help. Built
    // from the same env var by dropping the folder off the end, because the
    // release notes sit beside the two help folders rather than inside one.
    //
    // This will 403: the release prefix is NOT public the way dev/ and prod/
    // are, so a release note cannot be read this way at all. The route is
    // unmounted for exactly that reason and nothing reaches this branch today
    // — it is written out so that restoring the route does not also quietly
    // restore a wrong URL.
    const url =
      kind === "release"
        ? `${base.replace(/\/(dev|prod)$/, "")}/release/${apiEnv}/${name}.html`
        : `${base}/${name}.html`;

    return section ? `${url}#${section}` : url;
  }, [enabled, name, kind, section, apiEnv]);

  // Kept so callers do not change shape. There is no request to retry: the
  // frame owns the load, and re-navigating it is what the `key` on the iframe
  // already does when `src` changes.
  const retry = useCallback(() => {}, []);

  return { src, problem: null as string | null, retry };
};
