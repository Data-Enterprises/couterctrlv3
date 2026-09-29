import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { XMarkIcon } from "@heroicons/react/16/solid";
import Modal from "./Modal";
import InfoButton from "./InfoButton";
import { comingSoonSection } from "../utils/comingSoonHelp";

/** Served straight from `public/`, so this is a path and not a fetch. */
const DOC = "/coming-soon.html";

/**
 * The "?" on a Coming Soon page, and the overview it opens.
 *
 * Every other page carries its own "?" inside a panel header it already has.
 * The eight Coming Soon pages have eight different headers and no "?" between
 * them, so this sits in the app frame instead and works out which page it is
 * on from the route — which is also what decides where in the document it
 * opens.
 *
 * **Not an S3 help page.** The rest of the "?" system fetches a signed URL and
 * re-signs it before it lapses, because those pages live in a bucket. This one
 * is a single client document that ships with the app, so it is a static file
 * in `public/` and the iframe loads it by path: nothing to sign, nothing to
 * expire, nothing to upload before it works. That also means it is right the
 * moment the branch is, which is the property that matters when it is being
 * shown rather than maintained.
 *
 * Fixed under the title bar rather than in the page, so it lands in the same
 * place on all eight and no page has to make room for it — and it is a
 * deliberately reversible promise: a page leaves this document behind when it
 * is released, and gets the ordinary `PageInfoButton` in its own header.
 *
 * Renders nothing anywhere else. The route not being in the map is the whole
 * gate.
 */
const ComingSoonHelp = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const section = comingSoonSection(pathname);

  // A different page means a different anchor, so the frame has to re-navigate
  // — and it should come up masked again rather than showing the last page's
  // section for a frame.
  useEffect(() => {
    setLoaded(false);
  }, [section]);

  if (!section) return null;

  return (
    <>
      {/* z-40: under the modals, over the page. The title bar is h-12 and
          holds z-50, so this clears it rather than competing with it. */}
      <div className="fixed right-3 top-[56px] z-40">
        {/* "light" rather than "navy": the navy variant is a 22px square meant
            for a navy panel header, and this sits on the page. */}
        <InfoButton
          variant="light"
          onClick={() => setOpen(true)}
          title="About the Coming Soon pages"
          className="border border-brand_navy/20 bg-custom-white shadow-md hover:border-brand_navy/40"
        />
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        padded={false}
        modalClassName="bg-custom-white w-[860px] max-w-[92vw] h-[85vh] overflow-hidden"
      >
        <div className="relative h-full w-full">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand_line_2 border-t-brand_navy" />
            </div>
          )}

          <iframe
            // Re-navigates when the section changes; a mounted frame ignores a
            // new hash and stays where it was.
            key={section}
            src={`${DOC}#${section}`}
            title="Coming Soon pages"
            sandbox="allow-scripts"
            onLoad={() => setLoaded(true)}
            className="block h-full w-full border-0"
          />

          <button
            onClick={() => setOpen(false)}
            title="Close"
            aria-label="Close"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md bg-custom-white/80 text-content/85 shadow-sm transition-colors hover:bg-custom-white hover:text-content"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </Modal>
    </>
  );
};

export default ComingSoonHelp;
