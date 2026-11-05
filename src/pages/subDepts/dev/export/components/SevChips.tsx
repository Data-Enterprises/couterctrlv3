// Utils
import { SEV_CHIP } from "../utils";

// Interfaces
import type { ItemSev } from "../../utils/gradedItems";

interface SevChipsProps {
  value: Set<ItemSev>;
  onToggle: (sev: ItemSev) => void;
  /** Shown when the dataset is selected but no severity is — that combination
   *  produces an empty section, and saying so beats a silently missing file. */
  hint?: boolean;
}

/**
 * Severity chips for one preset. Filter only.
 *
 * Clicking a chip never checks or unchecks its dataset. The two used to be
 * bound together — a chip that emptied the set also cleared the checkbox, and
 * seeding on check re-lit a chip the user had just turned off — so clicking
 * "Critical" on a preset whose Critical chip was already lit silently dropped
 * the whole dataset from the download. From the outside that read as the
 * severity filter doing nothing.
 *
 * One component for all three chip rows rather than three copies, so they can't
 * drift apart again.
 */
const SevChips = ({ value, onToggle, hint }: SevChipsProps) => (
  <>
    <div className="flex gap-1.5 flex-wrap">
      {SEV_CHIP.map(({ sev, label, activeClass }) => (
        <button
          key={sev}
          onClick={() => onToggle(sev)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
            value.has(sev) ? activeClass : "bg-custom-white border-gray-200 text-content"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
    {hint && (
      <p className="text-[10px] text-amber-800 mt-1">
        Pick at least one severity or this dataset exports nothing.
      </p>
    )}
  </>
);

export default SevChips;
