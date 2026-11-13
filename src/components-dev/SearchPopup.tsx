// Interfaces
import type { ReactNode } from "react";

interface SearchPopupProps {
  /** Closes the pop-up; called on a click outside the card. */
  onClose: () => void;
  /** The search card, usually a SearchCard. */
  children: ReactNode;
}

/** A page's re-search: its search card over the page, which blurs rather than
 *  darkens. A click outside the card closes it. */
const SearchPopup = ({ onClose, children }: SearchPopupProps) => (
  <div
    className="cc-modal-backdrop z-50"
    onClick={onClose}
  >
    <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

export default SearchPopup;
