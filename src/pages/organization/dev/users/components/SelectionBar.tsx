interface SelectionBarProps {
  /** Picking people to reactivate (the Inactive list) or to deactivate. */
  showInactive: boolean;
  pickedCount: number;
  pickableCount: number;
  allPicked: boolean;
  onToggleAll: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/** The bar shown while picking users: what the pick is for, how many are
 *  picked, select all, Cancel and the action. */
const SelectionBar = ({
  showInactive,
  pickedCount,
  pickableCount,
  allPicked,
  onToggleAll,
  onCancel,
  onConfirm,
}: SelectionBarProps) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2 px-3 py-2 rounded-lg bg-filter_active border border-filter_active_border">
    <span className="text-[12.5px] font-semibold text-brand_navy">
      {showInactive ? "Choose who to reactivate" : "Choose who to deactivate"}
    </span>
    <span className="text-[12px] tabular-nums text-content/95">
      {pickedCount} of {pickableCount} picked
    </span>
    {pickableCount > 0 && (
      <button
        onClick={onToggleAll}
        className="text-[11.5px] font-semibold text-brand_navy underline underline-offset-2"
      >
        {allPicked ? "Clear selection" : `Select all ${pickableCount} shown`}
      </button>
    )}
    <span className="flex-1" />
    <button
      onClick={onCancel}
      className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-brand_line_2 bg-custom-white text-content hover:border-brand_slate"
    >
      Cancel
    </button>
    <button
      onClick={onConfirm}
      disabled={pickedCount === 0}
      className={`text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white disabled:cursor-not-allowed disabled:opacity-40 ${
        showInactive
          ? "bg-brand_navy hover:bg-brand_navy_hover"
          : "bg-brand_danger hover:bg-brand_danger/85"
      }`}
    >
      {showInactive ? "Reactivate" : "Deactivate"} {pickedCount}
    </button>
  </div>
);

export default SelectionBar;
