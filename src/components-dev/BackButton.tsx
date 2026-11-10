// Components
import { ChevronLeftIcon } from "@heroicons/react/16/solid";

interface BackButtonProps {
  onClick: () => void;
  /** "navy" for a dark panel header, "light" for a white mobile card. */
  tone?: "navy" | "light";
  /** Hover text and accessible name. The visible word is always "Back". */
  title?: string;
  /** The help panel's anchor, for the pages whose help points at this. */
  helpAnchor?: string;
  className?: string;
}

/**
 * "‹ Back": the way out of a page's results to its search.
 *
 * This used to be a magnifying glass, and nobody read it as "back". A client's
 * IT lead put it plainly: no one understands the little search icon is how you
 * go back to the search. So it says so, in a word, on every page.
 *
 * It does what the icon did — the results and the search are components of the
 * same page, so "back" here is a state change, not a navigation. The step
 * back up Orders' phone drill uses this too, so the two look the same.
 */
const BackButton = ({
  onClick,
  tone = "navy",
  title = "Back to the search",
  helpAnchor,
  className = "",
}: BackButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    data-help={helpAnchor}
    className={`flex flex-none items-center gap-0.5 rounded border font-semibold transition-colors ${
      tone === "navy"
        ? "h-[22px] pl-1 pr-1.5 text-[11px] border-custom-white/20 text-custom-white/95 hover:text-custom-white hover:border-custom-white/40"
        : "h-7 pl-1.5 pr-2 text-[12px] border-gray-200 text-content/95 active:bg-bkg"
    } ${className}`}
  >
    <ChevronLeftIcon className={tone === "navy" ? "w-3.5 h-3.5" : "w-4 h-4"} />
    Back
  </button>
);

export default BackButton;
