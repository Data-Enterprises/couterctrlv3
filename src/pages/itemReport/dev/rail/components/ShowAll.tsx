

interface ShowAllProps {
  total: number;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * The foot of a section that is showing less than it holds.
 *
 * The label carries the count, so it discloses that there is more as well as
 * offering it — a section that silently stopped at six was the same shape of
 * problem as a query that silently stopped at one page.
 *
 * Expands in place rather than scrolling inside a fixed height: the rail is
 * already one scroll container, and a second one inside it captures the wheel
 * and hides the sections below. Now that every section folds, the height this
 * costs is the reader's to reclaim.
 */
const ShowAll = ({ total, expanded, onToggle }: ShowAllProps) => (
  <button
    onClick={onToggle}
    className="mt-1 pl-1 text-[12px] font-medium text-brand_navy underline underline-offset-2 hover:opacity-75 transition-opacity"
  >
    {expanded ? "Show fewer" : `Show all ${total}`}
  </button>
);

export default ShowAll;
