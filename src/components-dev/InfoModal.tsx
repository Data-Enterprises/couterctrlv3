import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import Modal from "./Modal";
import { useAppSelector } from "../hooks";
import { useHelpPageUrl } from "../hooks/useHelpPageUrl";
import { HAS_MOBILE, type HelpPage } from "../constants/helpPages";

interface InfoModalProps {
  /** Which help page to show. The `-mobile` variant is picked here, not by
   *  the caller, so a page passes its own name and nothing else. */
  page: HelpPage;
  /** Optional `#anchor` within the page, e.g. a UPC module tab. */
  section?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The "?" help, as the page's own HTML in an iframe.
 *
 * The pages live in S3 and are fetched by signed URL when this opens — one
 * round trip before the frame has anything to load, which the old public
 * bucket did not have, hence the mask. `useHelpPageUrl` keeps the link fresh
 * while the sheet is open; see it for why that matters.
 *
 * They are complete documents — their own `<head>`, font links, a `<style>`
 * block that defines `:root` variables the app also uses, and a small script
 * for the jump pills. That rules out `innerHTML`: the head would be dropped,
 * the style block would redefine those variables for the whole app, and the
 * script would never run. An iframe keeps all three inside the frame.
 *
 * `sandbox="allow-scripts"` and deliberately **not** `allow-same-origin` —
 * together the two let a page out of the sandbox, and nothing here needs it.
 */
const InfoModal = ({ page, section, isOpen, onClose }: InfoModalProps) => {
  const isMobile = useAppSelector((state) => state.app.isMobile);
  const [loaded, setLoaded] = useState(false);

  const name = isMobile && HAS_MOBILE.has(page) ? `${page}-mobile` : page;
  const { src, problem, retry } = useHelpPageUrl({
    name,
    section,
    enabled: isOpen,
  });

  useEffect(() => {
    setLoaded(false);
  }, [src]);

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
      <div className="relative w-full h-full">
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
              onClick={retry}
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
