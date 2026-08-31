import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

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
const PerfCardHeader = ({ title, note, label, when, onSearch }: Props) => (
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
      <span className="min-w-0 truncate font-display text-[14px] font-bold text-content">
        {title}
      </span>
      {note && (
        <span className="flex-none text-[12px] text-content/85">{note}</span>
      )}
    </div>
    <div className="truncate px-4 pt-2 font-mono text-[10px] uppercase tracking-wider text-content/85">
      {label}
      {when ? ` · ${when}` : ""}
    </div>
  </>
);

export default PerfCardHeader;
