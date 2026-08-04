import { memo, useCallback } from "react";

/**
 * One row in the category list.
 *
 * Split out and memoized because a store can return 1100+ categories, and
 * dragging the threshold slider re-renders the list on every tick. Every prop
 * here is a **primitive** — including the already-resolved pill and dot class
 * names — so React can compare them cheaply and skip the rows that didn't
 * change. Passing the row object instead would defeat the memo entirely, since
 * the parent builds a new object each pass.
 *
 * Only rows whose grade actually crossed the threshold get new class strings,
 * so a typical slider tick re-renders a handful of rows rather than all 1100.
 */
interface CategoryRowProps {
  category: number;
  label: string;
  /** Pre-formatted so the row does no work of its own. */
  twText: string;
  lwText: string;
  lyText: string;
  lwPctText: string;
  lyPctText: string;
  /** Resolved in the parent's re-grade pass — these are what change with the
   *  threshold, and comparing them is what lets unchanged rows bail out. */
  dotClass: string;
  lwPillClass: string;
  lyPillClass: string;
  isSelected: boolean;
  onSelect: (category: number, isSelected: boolean) => void;
}

const CategoryRow = ({
  category,
  label,
  twText,
  lwText,
  lyText,
  lwPctText,
  lyPctText,
  dotClass,
  lwPillClass,
  lyPillClass,
  isSelected,
  onSelect,
}: CategoryRowProps) => {
  const handleClick = useCallback(
    () => onSelect(category, isSelected),
    [onSelect, category, isSelected],
  );

  return (
    <button
      onClick={handleClick}
      className={`list-row-skip w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
        isSelected
          ? "bg-row_selected border-row_selected_border"
          : "border-transparent hover:bg-gray-50"
      }`}
    >
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass}`} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-content truncate">{label}</div>
        {/* The comparison values themselves, so a percentage can be weighed
            against the size of what it moved. */}
        <div className="text-[12px] text-content/85 truncate">
          LW <span className="font-semibold">{lwText}</span> · LY{" "}
          <span className="font-semibold">{lyText}</span>
        </div>
      </div>
      <div className="flex items-center gap-[14px]">
        <span
          className="text-[13px] font-semibold text-content flex-shrink-0 pl-2.5 text-right"
          style={{ width: 64 }}
        >
          {twText}
        </span>
        {/* An em dash, not 0% — no comparison period is not a flat week. */}
        <span
          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${lwPillClass}`}
          style={{ width: 58 }}
        >
          {lwPctText}
        </span>
        <span
          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${lyPillClass}`}
          style={{ width: 58 }}
        >
          {lyPctText}
        </span>
      </div>
    </button>
  );
};

export default memo(CategoryRow);
