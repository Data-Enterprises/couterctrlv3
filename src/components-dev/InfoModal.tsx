import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import Modal from "./Modal";
import { useAppSelector } from "../hooks";
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
 * The pages live in S3 (`dev/` and `prod/` folders, public read) and are
 * complete documents — their own `<head>`, font links, a `<style>` block that
 * defines `:root` variables the app also uses, and a small script for the jump
 * pills. That rules out `innerHTML`: the head would be dropped, the style block
 * would redefine those variables for the whole app, and the script would never
 * run. An iframe keeps all three inside the frame.
 *
 * `sandbox="allow-scripts"` and deliberately **not** `allow-same-origin` —
 * together the two let a page out of the sandbox, and nothing here needs it.
 *
 * There is no API call. The browser GETs a public URL; no token, no CORS, no
 * `api/` function. Which folder it reads follows `apiEnv`, the same flag that
 * picks the API base URL, so the help matches the app the user is looking at.
 */
const InfoModal = ({ page, section, isOpen, onClose }: InfoModalProps) => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  const isMobile = useAppSelector((state) => state.app.isMobile);
  const [loaded, setLoaded] = useState(false);

  const base =
    apiEnv === "dev"
      ? import.meta.env.VITE_HELP_PAGES_URL_DEV
      : import.meta.env.VITE_HELP_PAGES_URL_PROD;
  const name = isMobile && HAS_MOBILE.has(page) ? `${page}-mobile` : page;
  const src = `${base}/${name}.html${section ? `#${section}` : ""}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalClassName={
        isMobile
          ? "bg-bkg w-full h-[92dvh]"
          : "bg-bkg w-[660px] max-w-[92vw] h-[85vh]"
      }
    >
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-end flex-shrink-0 pb-1.5">
          <button
            onClick={onClose}
            title="Close"
            aria-label="Close help"
            className="w-6 h-6 rounded-md flex items-center justify-center text-content/85 hover:text-content hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex-1 min-h-0">
          {/* Sits behind the frame rather than replacing it, so the load isn't
              restarted when it clears. A cross-origin frame fires `onLoad` for
              S3's error page too, so this only stays up while nothing at all
              has come back — which is what a user needs telling about. */}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[12.5px] text-content/75">
              Loading help…
            </div>
          )}
          <iframe
            // Re-navigates when the page or the section changes. Without it a
            // mounted frame ignores a new hash and stays where it was.
            key={src}
            src={src}
            title="Page help"
            sandbox="allow-scripts"
            onLoad={() => setLoaded(true)}
            className="w-full h-full rounded-lg border-0 bg-white"
          />
        </div>
      </div>
    </Modal>
  );
};

export default InfoModal;
