import { useState } from "react";
import { useAppSelector } from "../hooks";
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
 * It also decides which help a page gets.
 *
 * **Desktop** opens the panel, which can point at the controls it describes.
 * **A phone keeps the document**, and deliberately: the panel is a 600px
 * drawer beside the screen it annotates, and there is no beside on a phone —
 * pointing at a control the drawer is covering helps nobody. The phone help
 * is also written for the phone's own layout, which is a separate tree. Until
 * there is a mobile design for this, the `-mobile` documents stay.
 *
 * Either way the call sites say nothing about it.
 */
const PageInfoButton = ({
  page,
  section,
  variant,
  title,
  className,
}: PageInfoButtonProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useAppSelector((state) => state.app.isMobile);
  const content = isMobile ? undefined : helpContentFor(page);

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
