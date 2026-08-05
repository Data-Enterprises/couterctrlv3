import { memo, useCallback } from "react";

/**
 * One row in the vendor list.
 *
 * Memoized on primitives only — including the already-resolved pill and dot
 * class names — so dragging the threshold slider re-renders the handful of rows
 * whose grade actually crossed it rather than the whole list. Passing the row
 * object would defeat the memo, since the parent builds a new one each pass.
 * Same reasoning as CategoryRow.
 */
interface VendorRowProps {
  vendorId: string;
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
  onSelect: (vendorId: string, isSelected: boolean) => void;
}

const VendorRow = ({
  vendorId,
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
}: VendorRowProps) => {
  const handleClick = useCallback(
    () => onSelect(vendorId, isSelected),
    [onSelect, vendorId, isSelected],
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

export default memo(VendorRow);
