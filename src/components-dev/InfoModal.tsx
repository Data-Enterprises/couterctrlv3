import { useCallback, useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import Modal from "./Modal";
import { useAppSelector } from "../hooks";
import { HAS_MOBILE, type HelpPage } from "../constants/helpPages";
import {
  getHelpPageUrl,
  helpFailed,
  type HelpKind,
  type HelpPageUrlResp,
} from "../api/helpPages";
import type { JsonError } from "../interfaces";

interface InfoModalProps {
  /** Which help page to show. The `-mobile` variant is picked here, not by
   *  the caller, so a page passes its own name and nothing else. */
  page?: HelpPage;
  /** A release note instead of a help page — its name is a date, from
   *  `GET /help/releases`. */
  release?: string;
  /** Optional `#anchor` within the page, e.g. a UPC module tab. */
  section?: string;
  isOpen: boolean;
  onClose: () => void;
  /** A slim bar above the frame, for a caller that has something to choose —
   *  release notes pick which date to read. */
  toolbar?: React.ReactNode;
}

/**
 * The "?" help, as the page's own HTML in an iframe.
 *
 * The pages live in S3 and are fetched by signed URL: `GET /help/page_url`
 * answers with a link good for a few minutes, which goes straight into the
 * frame. That is one round trip before the frame has anything to load, which
 * the old public-bucket path did not have — hence the mask below.
 *
 * They are complete documents — their own `<head>`, font links, a `<style>`
 * block that defines `:root` variables the app also uses, and a small script
 * for the jump pills. That rules out `innerHTML`: the head would be dropped,
 * the style block would redefine those variables for the whole app, and the
 * script would never run. An iframe keeps all three inside the frame.
 *
 * `sandbox="allow-scripts"` and deliberately **not** `allow-same-origin` —
 * together the two let a page out of the sandbox, and nothing here needs it.
 *
 * Which folder it reads follows `apiEnv`, the same flag that picks the API
 * base URL, so the help matches the app the user is looking at.
 */
const InfoModal = ({
  page,
  release,
  section,
  isOpen,
  onClose,
  toolbar,
}: InfoModalProps) => {
  const { apiEnv, url, token, isMobile } = useAppSelector((state) => ({
    apiEnv: state.app.apiEnv,
    url: state.app.url,
    token: state.app.token,
    isMobile: state.app.isMobile,
  }));

  const [src, setSrc] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const kind: HelpKind = release ? "release" : "help";
  const name = release
    ? release
    : page && isMobile && HAS_MOBILE.has(page)
      ? `${page}-mobile`
      : (page ?? "");

  /**
   * Ask for a link, and ask again before it lapses.
   *
   * The frame is cross-origin, so an expired link renders S3's own 403 INSIDE
   * it — no error, no event, nothing this code can see. A help sheet left open
   * over lunch is not exotic, so the link is re-signed a minute early rather
   * than discovered dead by whoever comes back to it.
   */
  const fetchUrl = useCallback(() => {
    if (!name) return;
    setProblem(null);
    getHelpPageUrl(url, token, { name, env: apiEnv as "dev" | "prod", kind })
      .then((resp) => {
        const j = resp.data as HelpPageUrlResp;
        if (helpFailed(j) || !j.url) {
          setProblem("That help page could not be opened.");
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
            ? "There is no help page for this screen yet."
            : status === 403
              ? "That help page is not available on this account."
              : "The help page could not be loaded.",
        );
      });
  }, [name, kind, section, url, token, apiEnv]);

  useEffect(() => {
    if (!isOpen) {
      // Closing stops the re-signing and drops the link, so reopening asks
      // for a fresh one rather than reusing a stale one.
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
      setSrc("");
      setLoaded(false);
      return;
    }
    setLoaded(false);
    fetchUrl();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, [isOpen, fetchUrl]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      padded={false}
      modalClassName={
        isMobile
          ? "bg-[#f4f7f8] w-full h-[92dvh] overflow-hidden"
          : "bg-[#f4f7f8] w-[600px] max-w-[92vw] h-[85vh] overflow-hidden"
      }
    >
      {/* The page fills the modal edge to edge: it has its own navy header and
          its own background, so a frame around it reads as a second window. */}
      <div className="relative w-full h-full flex flex-col">
        {toolbar && (
          <div className="flex-shrink-0 bg-custom-white border-b border-brand_line px-3 py-2 pr-12">
            {toolbar}
          </div>
        )}
        <div className="relative flex-1 min-h-0">
        {/* Behind the frame rather than in place of it, so clearing doesn't
            restart the load. A cross-origin frame fires `onLoad` for S3's
            error page too, so this only stays up while nothing at all has come
            back — which is what a user needs telling about. */}
        {!loaded && !problem && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-brand_line_2 border-t-brand_navy animate-spin" />
            <span className="text-[12.5px] text-content/85">
              {src ? "Loading help…" : "Fetching the page…"}
            </span>
          </div>
        )}

        {problem && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
            <span className="text-[13px] font-semibold">{problem}</span>
            <button
              type="button"
              onClick={fetchUrl}
              className="text-[12.5px] font-semibold text-brand_navy_hover underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {src && !problem && (
          <iframe
            // Re-navigates when the link, the page or the section changes.
            // Without it a mounted frame ignores a new hash and stays where it
            // was.
            key={src}
            src={src}
            title="Page help"
            sandbox="allow-scripts"
            onLoad={() => setLoaded(true)}
            className="w-full h-full border-0"
          />
        )}

        </div>

        {/* Over the page's own navy header, where the sheet has nothing but
            its watermark. The page can't draw this itself — it doesn't know
            it's in a modal. */}
        <button
          onClick={onClose}
          title="Close"
          aria-label="Close help"
          className="absolute top-2.5 right-3 w-7 h-7 rounded-md flex items-center justify-center text-custom-white/70 hover:text-custom-white hover:bg-custom-white/10 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </Modal>
  );
};

export default InfoModal;
