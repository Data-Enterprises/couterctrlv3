import {
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";

interface Props {
  /** What the card is about — the store, the group, the item, the lens. */
  title: string;
  /** A short qualifier beside the title, e.g. "5 stores". */
  note?: string;
  /**
   * The mono line under the title, naming every active scope in the order it
   * narrows. Without it a filtered figure looks like a wrong one.
   */
  label: string;
  /** The window, or the day inside it — see the note in the body. */
  when: string;
  /** Back to the search card. */
  onSearch: () => void;
  /** Opens the page's "?" sheet. The icon only renders when this is given. */
  onInfo?: () => void;
  /** Makes the title row expand a card. The chevron only renders when this is
   *  given, so the pages that use this header as a plain caption are
   *  unchanged. */
  onToggle?: () => void;
  open?: boolean;
  /**
   * Makes the TITLE itself a control — an underline and a caret, opening
   * whatever picker the page provides.
   *
   * Separate from `onToggle`, which belongs to the date line: one opens the
   * card, the other changes what the card is about, and a single tap target
   * doing both would be guessing which was meant.
   */
  onTitleTap?: () => void;
}

/**
 * The top of every mobile Performance card.
 *
 * Two decisions live here rather than in six copies of them.
 *
 * The magnifying glass is the way back to the search card. That used to be the
 * date range, which had a chevron and no other hint — the range was doing two
 * jobs and only advertising one, so the way to search again had to be learned
 * rather than seen. Now the icon is the control and the date is text.
 *
 * The window and the selected day take turns on the mono line instead of
 * stacking. Both together overflow a phone once a store or item name is in
 * front of them, and once you have scoped to Thursday the week is context you
 * are no longer reading — the day carries its own date, so nothing is lost.
 */
const PerfCardHeader = ({
  title,
  note,
  label,
  when,
  onSearch,
  onInfo,
  onToggle,
  open = false,
  onTitleTap,
}: Props) => (
  <>
    {/* items-center, not items-baseline: an icon has no baseline of its own, so
        baseline alignment hung it off the bottom of the title's text box. */}
    <div className="flex items-center gap-2 px-4 pt-3">
      {/* The same bordered 7x7 the desktop panels use for New search — the box
          is what makes it read as a button rather than as decoration beside
          the title. */}
      <button
        type="button"
        onClick={onSearch}
        aria-label="New search"
        className="flex h-7 w-7 flex-none items-center justify-center rounded border border-gray-200 text-content/85 active:bg-bkg"
      >
        <MagnifyingGlassIcon className="h-3.5 w-3.5" />
      </button>
      {onTitleTap ? (
        <button
          type="button"
          onClick={onTitleTap}
          className="flex min-w-0 items-center gap-1 rounded text-left active:opacity-70"
        >
          <span className="min-w-0 truncate font-display text-[14px] font-bold text-content underline decoration-content/40 underline-offset-[3px]">
            {title}
          </span>
          <ChevronDownIcon className="h-4 w-4 flex-none text-content/85" />
        </button>
      ) : (
        <span className="min-w-0 truncate font-display text-[14px] font-bold text-content">
          {title}
        </span>
      )}
      {note && (
        <span className="flex-none text-[12px] text-content/85">{note}</span>
      )}
      {onInfo && (
        // Same solid 20px mark as the desktop headers' "?".
        <button
          type="button"
          onClick={onInfo}
          aria-label="What this page shows"
          className="-mr-1 ml-auto flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/85 active:bg-bkg"
        >
          <QuestionMarkCircleIcon className="h-5 w-5" />
        </button>
      )}
    </div>
    {/* The date line doubles as the expand control when the card is one. The
        icons above stay their own buttons — a search that also collapsed the
        card would be two actions on one tap. */}
    {onToggle ? (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 pt-2 text-left active:bg-bkg"
      >
        <span className="min-w-0 flex-1 truncate font-mono text-[10px] uppercase tracking-wider text-content/85">
          {[label, when].filter(Boolean).join(" · ")}
        </span>
        {open ? (
          <ChevronDownIcon className="h-4 w-4 flex-none text-content/85" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 flex-none text-content/85" />
        )}
      </button>
    ) : (
      <div className="truncate px-4 pt-2 font-mono text-[10px] uppercase tracking-wider text-content/85">
        {/* Either part can be empty — no store selected leaves only the dates —
            so join what's there rather than leading with a stray dot. */}
        {[label, when].filter(Boolean).join(" · ")}
      </div>
    )}
  </>
);

export default PerfCardHeader;
