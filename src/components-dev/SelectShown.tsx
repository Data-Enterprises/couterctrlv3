/**
 * Stage or clear every row the column is currently showing.
 *
 * The complaint these filters came from was the clicking, and narrowing 405
 * users down to 12 is no help if all twelve still have to be clicked one at a
 * time. This acts on what is SHOWN and never on the hidden rest -- `Assign
 * all` is the button that ignores the search, and it does so deliberately.
 *
 * Selecting ADDS to what is already staged rather than replacing it, so a
 * selection can be built across several searches: narrow to one company, take
 * all of them, narrow to the next, take those too, then assign once. The
 * running count is there because that only makes sense if you can see it.
 */
const SelectShown = ({
  shown,
  selected,
  onSelectAll,
  onClear,
}: {
  shown: number;
  selected: number;
  onSelectAll: () => void;
  onClear: () => void;
}) => (
  <div className="flex items-center gap-2 mb-1 text-[10px] text-content/85">
    <button
      onClick={onSelectAll}
      disabled={shown === 0}
      className="font-semibold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
    >
      Select all {shown} shown
    </button>
    {selected > 0 && (
      <>
        <span aria-hidden="true">·</span>
        <span className="font-semibold text-content">{selected} selected</span>
        <button onClick={onClear} className="hover:underline">
          Clear
        </button>
      </>
    )}
  </div>
);

export default SelectShown;
