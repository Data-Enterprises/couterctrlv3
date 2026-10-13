import { useEffect, useState } from "react";
import ColFilter from "../../../../components-dev/filters/ColFilterPopover";
import { colInputStyle } from "../../../../components-dev/filters/colFilterStyles";

/**
 * "Search by store", as the column heading that does it.
 *
 * One component for all three places the Sales page asks the question — the
 * graded ledger, the Compare tick list and the group landing — because three
 * copies of a draft/apply popover is how the same filter ends up behaving
 * three slightly different ways.
 *
 * The draft/apply split comes with `ColFilterPopover` and is kept: it is what
 * every other grid in the app does, and a store list that re-filtered on each
 * keystroke would jump under the reader as they typed a store number.
 *
 * `activeValue` puts the applied text in the heading, so a list narrowed to
 * "owensboro" says so without the popover being reopened — which matters more
 * here than on an item grid, because a filtered store list looks exactly like
 * a short group.
 */
const StoreColFilter = ({
  value,
  onApply,
  label = "Store",
  labelSize = "text-[11.5px]",
}: {
  /** The applied filter. Empty means the column is not filtering. */
  value: string;
  onApply: (next: string) => void;
  label?: string;
  labelSize?: string;
}) => {
  const [draft, setDraft] = useState(value);

  // Follows the applied value when something else clears it — a new search,
  // or the Clear in another copy of this filter.
  useEffect(() => setDraft(value), [value]);

  return (
    <ColFilter
      label={label}
      labelSize={labelSize}
      active={value.trim().length > 0}
      activeValue={value.trim() || undefined}
      onApply={() => onApply(draft.trim())}
      onClear={() => {
        setDraft("");
        onApply("");
      }}
    >
      <input
        autoFocus
        style={colInputStyle}
        placeholder="Search store…"
        aria-label="Search store"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
    </ColFilter>
  );
};

export default StoreColFilter;
