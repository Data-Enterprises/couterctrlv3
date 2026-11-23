// Hooks
import { useState } from "react";

// Interfaces
import type { HelpPage } from "../constants/helpPages";

// Components
import InfoButton from "./InfoButton";
import InfoModal from "./InfoModal";

interface PageInfoButtonProps {
  /** The page's own help name. Desktop or phone is decided in InfoModal. */
  page: HelpPage;
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
 * Which help that is — the desktop panel, which can point at the controls it
 * describes, or the phone sheet — is InfoModal's call, so the call sites say
 * nothing about it.
 */
const PageInfoButton = ({ page, variant, title, className }: PageInfoButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <InfoButton
        onClick={() => setOpen(true)}
        variant={variant}
        title={title}
        className={className}
      />
      <InfoModal page={page} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default PageInfoButton;
