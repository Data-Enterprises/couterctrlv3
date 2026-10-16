import { useState } from "react";
import InfoButton from "./InfoButton";
import InfoModal from "./InfoModal";
import HelpPanel from "./help/HelpPanel";
import { helpContentFor } from "./help/content";
import type { HelpPage } from "../constants/helpPages";

interface PageInfoButtonProps {
  /** The page's own help name. Desktop or phone is decided in InfoModal. */
  page: HelpPage;
  /** Optional `#anchor` within the page. */
  section?: string;
  /** Passed through to InfoButton — "navy" for a panel header, "light" for a
   *  white mobile card. */
  variant?: "navy" | "light";
  title?: string;
  className?: string;
}

/**
 * The "?" button and the help it opens, as one thing.
 *
 * Every page did the same three steps itself — hold `infoOpen`, render
 * `InfoButton`, render the popover — which is a lot of identical state for
 * something a page has no opinion about. Here a call site is one line and the
 * only thing it says is which page it is.
 *
 * It also decides which help a page gets. A screen whose content has been
 * written opens the panel, which can point at the controls it describes;
 * every other screen keeps opening its S3 document until its turn comes. The
 * call sites say nothing about either, so converting a page is one entry in
 * `help/content`, not a change here and a change there.
 */
const PageInfoButton = ({
  page,
  section,
  variant,
  title,
  className,
}: PageInfoButtonProps) => {
  const [open, setOpen] = useState(false);
  const content = helpContentFor(page);

  return (
    <>
      <InfoButton
        onClick={() => setOpen(true)}
        variant={variant}
        title={title}
        className={className}
      />
      {content ? (
        open && <HelpPanel content={content} onClose={() => setOpen(false)} />
      ) : (
        <InfoModal
          page={page}
          section={section}
          isOpen={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default PageInfoButton;
