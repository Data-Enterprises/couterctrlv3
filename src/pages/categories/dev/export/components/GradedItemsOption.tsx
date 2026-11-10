// Utils
import { SEV_CHIP } from "../utils";

// Interfaces
import type { GradedSev } from "../interfaces";

interface GradedItemsOptionProps {
  hasItems: boolean;
  checked: boolean;
  onToggle: () => void;
  itemSevs: Set<GradedSev>;
  onSev: (sev: GradedSev) => void;
  /** What it grades on, e.g. "sales at 9%". */
  basis: string;
}

/** Graded items: the checkbox, plus severity chips that are the filter. */
const GradedItemsOption = ({ hasItems, checked, onToggle, itemSevs, onSev, basis }: GradedItemsOptionProps) => {
  return (
    <div className={`flex items-start gap-3 ${hasItems ? "" : "opacity-40"}`}>
      <input
        type="checkbox"
        disabled={!hasItems}
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-content">Items Graded</p>
        <p className="text-[11px] text-content mt-0.5 mb-1.5">
          {hasItems
            ? `TY vs LW vs LY per item, graded on ${basis}`
            : "Select a category to export its items"}
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {SEV_CHIP.map(({ sev, label, activeClass }) => (
            <button
              key={sev}
              disabled={!hasItems}
              onClick={() => onSev(sev)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors disabled:cursor-not-allowed ${
                itemSevs.has(sev)
                  ? activeClass
                  : "bg-custom-white border-gray-200 text-content"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GradedItemsOption;
