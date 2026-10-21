import { useCallback, useMemo } from "react";
import { useAppSelector } from ".";

/**
 * The URL of one help page.
 *
 * TEMPORARY, and now the last thing in the app reading from the bucket: the
 * PHONE help only. Desktop help is data in `components-dev/help/content`, and
 * release notes are data in `content/releaseNotes` — neither comes through
 * here any more. What is left is the twelve `-mobile` documents, which stay
 * until the panel has a design that works on a small screen.
 *
 * Built from `VITE_HELP_PAGES_URL_*`. The signed-URL version is in git — see
 * "Help pages come from the API, signed, on the click" — but restoring it is
 * no longer the plan: the remaining documents are meant to become content
 * modules like the rest, and then this file goes.
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
  section,
  enabled,
}: {
  name: string;
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

    // Help only. The `release` kind used to build
    // `release/{env}/{name}.html` here and always 403'd — that prefix is not
    // public the way dev/ and prod/ are — which is why release notes moved
    // into the repo rather than being signed. Nothing asks for a release URL
    // now, and nothing should.
    const url = `${base}/${name}.html`;

    return section ? `${url}#${section}` : url;
  }, [enabled, name, section, apiEnv]);

  // Kept so callers do not change shape. There is no request to retry: the
  // frame owns the load, and re-navigating it is what the `key` on the iframe
  // already does when `src` changes.
  const retry = useCallback(() => {}, []);

  return { src, problem: null as string | null, retry };
};
