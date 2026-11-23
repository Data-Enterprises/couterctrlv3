// Interfaces
import type { Dataset } from "../../interfaces";

interface PresetChoicesProps {
  /** Each dataset to offer, with its title and what it holds. */
  choices: { key: Dataset; title: string; sub: string }[];
  selected: Set<Dataset>;
  onToggle: (dataset: Dataset) => void;
}

/** Presets mode: tick the datasets to put in the file. */
const PresetChoices = ({ choices, selected, onToggle }: PresetChoicesProps) => (
  <div className="px-4 pt-4 pb-2 space-y-3">
    <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium">
      Select data to include
    </p>

    {choices.map(({ key, title, sub }) => (
      <label key={key} className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={selected.has(key)}
          onChange={() => onToggle(key)}
          className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
        />
        <div>
          <p className="text-[13px] cc-row-title">{title}</p>
          <p className="text-[11px] text-content/95 mt-0.5">{sub}</p>
        </div>
      </label>
    ))}
  </div>
);

export default PresetChoices;
