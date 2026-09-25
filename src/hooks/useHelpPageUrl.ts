import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from ".";
import {
  getHelpPageUrl,
  helpFailed,
  type HelpEnv,
  type HelpKind,
  type HelpPageUrlResp,
} from "../api/helpPages";
import type { JsonError } from "../interfaces";

/**
 * A signed URL for one help page or release note, kept fresh.
 *
 * Shared by the "?" sheet and the release notes page because the expiry
 * handling is the part worth writing once. The frame these go into is
 * cross-origin, so an expired link renders S3's own 403 INSIDE it — no error,
 * no event, nothing this code can see. Anything left open longer than the
 * link's life would quietly become an AWS error page, so it is re-signed a
 * minute early rather than discovered dead by whoever comes back to it.
 *
 * `enabled` is what stops a closed sheet asking for links nobody wants.
 */
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
  const { apiEnv, url, token } = useAppSelector((state) => ({
    apiEnv: state.app.apiEnv,
    url: state.app.url,
    token: state.app.token,
  }));

  const [src, setSrc] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const fetchUrl = useCallback(() => {
    if (!name) return;
    setProblem(null);
    getHelpPageUrl(url, token, { name, env: apiEnv as HelpEnv, kind })
      .then((resp) => {
        const j = resp.data as HelpPageUrlResp;
        if (helpFailed(j) || !j.url) {
          setProblem("That page could not be opened.");
          return;
        }
        setSrc(section ? `${j.url}#${section}` : j.url);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(
          fetchUrl,
          Math.max(30, (j.expires_in ?? 900) - 60) * 1000,
        );
      })
      .catch((err: JsonError) => {
        const status = (err as { status?: number }).status;
        setProblem(
          status === 404
            ? "There is no page here yet."
            : status === 403
              ? "That page is not available on this account."
              : "The page could not be loaded.",
        );
      });
  }, [name, kind, section, url, token, apiEnv]);

  useEffect(() => {
    if (!enabled) {
      // Stop re-signing and drop the link, so coming back asks for a fresh
      // one rather than reusing a stale one.
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
      setSrc("");
      return;
    }
    fetchUrl();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, [enabled, fetchUrl]);

  return { src, problem, retry: fetchUrl };
};
