// Utils
import { CHECKBOX } from "../utils";

// Interfaces
import type { PresetId } from "../interfaces";

interface PresetChoicesProps {
  datasets: {
    id: PresetId;
    label: string;
    description: string;
    disabled: boolean;
  }[];
  selected: Set<PresetId>;
  onToggle: (id: PresetId) => void;
}

/** The presets to tick; one that has nothing to export is greyed out. */
const PresetChoices = ({
  datasets,
  selected,
  onToggle,
}: PresetChoicesProps) => (
  <>
    {datasets.map(({ id, label, description, disabled }) => (
      <label
        key={id}
        className={`flex items-start gap-3 group ${
          disabled ? "opacity-40" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          disabled={disabled}
          checked={selected.has(id)}
          onChange={() => onToggle(id)}
          className={CHECKBOX}
        />
        <div>
          <p className="text-[13px] cc-row-title">{label}</p>
          <p className="text-[11px] text-content mt-0.5">{description}</p>
        </div>
      </label>
    ))}
  </>
);

export default PresetChoices;
