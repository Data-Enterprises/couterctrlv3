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
    className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
    onClick={onClose}
  >
    <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

export default SearchPopup;
