import type { ReactNode } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";

interface Props {
  /** What this row is — a store, a sub department, a vendor, a category. */
  label: string;
  /** The figure beside the name, preformatted. Neutral: no grading on mobile
   *  Performance, so this is information and never a verdict. */
  change: string;
  /** A flag on the change, e.g. a short comparison period. */
  flagged?: boolean;
  flagNote?: string;
  /** The comparison, drawn under the name while collapsed. Omitted when the
   *  row has nothing to compare. */
  bars?: ReactNode;
  open: boolean;
  /**
   * Another card is open, so this one gives up its bars and keeps a single
   * title row.
   *
   * The open card is a whole report; leaving its neighbours at full height
   * means the thing you opened is never on screen by itself. The name and the
   * change are what the list is scanned for, so those stay.
   */
  minimised: boolean;
  /** Absent when the card cannot collapse — a single-result page. */
  onToggle?: () => void;
  /** The window, above the name. Given only when this card IS the page and has
   *  to say which week it is showing; in a list, the scope above says it once
   *  and repeating it on every row is noise. */
  when?: string;
  /** Back to the search card. Same single-result case as `when`. */
  onSearch?: () => void;
  /** Opens the page's "?" sheet. Same case again. */
  onInfo?: () => void;
  /** The report body. Rendered only while open. */
  children?: ReactNode;
}

/**
 * One row of a mobile Performance list, collapsed or expanded in place.
 *
 * Shared by every page that lists something and lets you open it: Sales by
 * store, Sub Dept Margins by department, Vendors by supplier, Loss Prevention
 * by store again. What a card contains differs per page; that it opens where
 * it sits, alone, and carries a name, a change and a comparison does not.
 *
 * Expanding is not navigation. The card stays in place and the report opens
 * under its own header, so there is nothing to go back FROM and no screen to
 * lose your place in.
 */
const MobilePerfCard = ({
  label,
  change,
  flagged = false,
  flagNote,
  bars,
  open,
  minimised,
  onToggle,
  when,
  onSearch,
  onInfo,
  children,
}: Props) => {
  const Header = onToggle ? "button" : "div";

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-custom-white shadow-md transition-colors ${
        open ? "border-gray-300" : "border-gray-200"
      }`}
    >
      {/* When this card is the whole page, the page's controls live on it
          rather than on a header above that would print the same name twice.
          They sit outside the toggle — which that case doesn't have anyway —
          so neither can open or close anything. */}
      {(onSearch || onInfo) && (
        <div className="flex items-center gap-2 px-3.5 pb-1 pt-3">
          {onSearch && (
            <button
              type="button"
              onClick={onSearch}
              aria-label="New search"
              className="flex h-7 w-7 flex-none items-center justify-center rounded border border-gray-200 text-content/85 active:bg-bkg"
            >
              <MagnifyingGlassIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="min-w-0 flex-1 truncate font-mono text-[10px] uppercase tracking-wider text-content/85">
            {when}
          </span>
          {onInfo && (
            <button
              type="button"
              onClick={onInfo}
              aria-label="What this page shows"
              className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/85 active:bg-bkg"
            >
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      <Header
        {...(onToggle
          ? {
              type: "button" as const,
              onClick: onToggle,
              "aria-expanded": open,
            }
          : {})}
        className={`block w-full px-3.5 text-left ${
          minimised ? "py-2.5" : "py-3"
        } ${onToggle ? "active:bg-bkg" : ""}`}
      >
        <div className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
            {label}
          </span>
          <span
            className={`flex-none text-[12px] font-semibold ${
              flagged
                ? "rounded bg-gray-200 px-1.5 text-content"
                : "text-content/85"
            }`}
          >
            {change}
          </span>
          {onToggle &&
            (open ? (
              <ChevronDownIcon className="h-4 w-4 flex-none self-center text-content/85" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 flex-none self-center text-content/85" />
            ))}
        </div>

        {flagged && !minimised && flagNote && (
          <div className="text-[11px] text-content/85">{flagNote}</div>
        )}

        {/* The comparison belongs to the collapsed row; inside an open card it
            reappears under the headline figure, where it reads against it
            rather than standing in for it. */}
        {!minimised && !open && bars && <div className="mt-2">{bars}</div>}
      </Header>

      {open && children}
    </section>
  );
};

export default MobilePerfCard;
