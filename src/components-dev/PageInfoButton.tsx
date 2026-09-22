import { useState } from "react";
import InfoButton from "./InfoButton";
import InfoModal from "./InfoModal";
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
 */
const PageInfoButton = ({
  page,
  section,
  variant,
  title,
  className,
}: PageInfoButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <InfoButton
        onClick={() => setOpen(true)}
        variant={variant}
        title={title}
        className={className}
      />
      <InfoModal
        page={page}
        section={section}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default PageInfoButton;
