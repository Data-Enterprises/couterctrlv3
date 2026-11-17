// Utils
import { COLS, SOURCE_LABELS } from "../../utils";

// Interfaces
import type { Preset } from "../../interfaces";

interface CustomConfigProps {
  source: Preset;
  onSource: (source: Preset) => void;
  available: Record<Preset, boolean>;
  /** The ticked columns of the chosen source. */
  picked: Set<string>;
  onToggleCol: (key: string) => void;
}

/** Custom mode's left column: the data source, then its columns to tick. */
const CustomConfig = ({
  source,
  onSource,
  available,
  picked,
  onToggleCol,
}: CustomConfigProps) => (
  <div className="p-3.5 border-r border-line_hair">
    <p className="text-[10px] cc-caps mb-2">Data source</p>
    {(Object.keys(SOURCE_LABELS) as Preset[]).map((src, i, all) => (
      <label
        key={src}
        className={`flex items-center gap-1.5 cursor-pointer ${
          i === all.length - 1 ? "mb-3.5" : "mb-1.5"
        } ${!available[src] ? "opacity-40" : ""}`}
      >
        <input
          type="radio"
          checked={source === src}
          onChange={() => onSource(src)}
          disabled={!available[src]}
        />
        <span className="text-[11.5px] text-content">{SOURCE_LABELS[src]}</span>
      </label>
    ))}

    <p className="text-[10px] cc-caps mb-2">Columns</p>
    {COLS[source].map((c) => (
      <label
        key={c.key}
        className="flex items-center gap-1.5 mb-1.5 cursor-pointer"
      >
        <input
          type="checkbox"
          checked={picked.has(c.key)}
          onChange={() => onToggleCol(c.key)}
        />
        <span className="text-[11.5px] text-content">{c.label}</span>
      </label>
    ))}
  </div>
);

export default CustomConfig;
