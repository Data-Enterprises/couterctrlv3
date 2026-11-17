// Utils
import { LENSES } from "../utils";

// Interfaces
import type { ExplorerLens } from "../../../../features/dev/devCashiersSlice";

interface LensChipsProps {
  lens: ExplorerLens;
  onLensChange: (lens: ExplorerLens) => void;
}

/** The lens buttons over the signal list: Store, Cashier, Item, Terminal. */
const LensChips = ({ lens, onLensChange }: LensChipsProps) => (
  <div
    data-help="grouping"
    className="flex gap-1 p-2 border-b border-line_hair flex-shrink-0"
  >
    {LENSES.map((l) => (
      <button
        key={l.key}
        onClick={() => onLensChange(l.key)}
        className={`text-[11.5px] font-medium px-2.5 py-1 rounded-full transition-colors ${
          lens === l.key
            ? "bg-brand_navy text-custom-white"
            : "bg-fill_soft text-content hover:bg-fill_muted"
        }`}
      >
        {l.label}
      </button>
    ))}
  </div>
);

export default LensChips;
