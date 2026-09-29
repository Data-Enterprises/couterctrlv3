import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { XMarkIcon } from "@heroicons/react/16/solid";
import Modal from "./Modal";
import InfoButton from "./InfoButton";
import { comingSoonSection } from "../utils/comingSoonHelp";

/** Served straight from `public/`, so this is a path and not a fetch. */
const DOC = "/coming-soon.html";

interface Props {
  /** Passed through to InfoButton — these sit in navy panel headers. */
  variant?: "navy" | "light";
  className?: string;
}

/**
 * The "?" already on a Coming Soon page, opening the Coming Soon overview.
 *
 * Drops in where each page had `InfoButton` plus an `InfoPopover` glossary:
 * same button, same place in the same header, different thing behind it. The
 * route decides which section of the document it opens at, so a page says
 * nothing about itself here.
 *
 * **Not an S3 help page.** The rest of the "?" system fetches a signed URL and
 * re-signs it before it lapses, because those pages live in a bucket. This one
 * is a single client document that ships with the app, so it is a static file
 * in `public/` and the iframe loads it by path: nothing to sign, nothing to
 * expire, nothing to upload before it works. It is also right the moment the
 * branch is, which is the property that matters while it is being shown.
 *
 * Renders nothing on a route outside `comingSoonSection` — a released page
 * that kept this button would open a document that no longer describes it.
 */
const ComingSoonHelp = ({ variant = "navy", className }: Props) => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const section = comingSoonSection(pathname);

  // A different page means a different anchor, so the frame re-navigates — and
  // it should come up masked rather than showing the last section for a frame.
  useEffect(() => {
    setLoaded(false);
  }, [section]);

  if (!section) return null;

  return (
    <>
      <InfoButton
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
        title="About the Coming Soon pages"
      />

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        padded={false}
        modalClassName="bg-custom-white w-[880px] max-w-[94vw] h-[88vh] overflow-hidden"
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
