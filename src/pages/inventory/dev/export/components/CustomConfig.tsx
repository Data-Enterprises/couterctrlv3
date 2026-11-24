// Utils
import { COLS, colLabel } from "../utils";

// Interfaces
import type { Preset, Source } from "../interfaces";

interface CustomConfigProps {
  presets: Preset[];
  available: Record<Source, boolean>;
  source: Source;
  onSource: (source: Source) => void;
  /** The ticked columns of the chosen source. */
  picked: Set<string>;
  onToggleCol: (key: string) => void;
  groupNoun: string;
}

/** Custom mode's left column: the data source, then its columns to tick. */
const CustomConfig = ({
  presets,
  available,
  source,
  onSource,
  picked,
  onToggleCol,
  groupNoun,
}: CustomConfigProps) => (
  <div className="p-3.5 border-r border-line_hair">
    <p className="text-[10px] cc-caps mb-2">Data source</p>
    {presets.map((p) => (
      <label
        key={p.source}
        className={`flex items-center gap-1.5 mb-1.5 cursor-pointer ${
          available[p.source] ? "" : "opacity-40"
        }`}
      >
        <input
          type="radio"
          checked={source === p.source}
          onChange={() => onSource(p.source)}
          disabled={!available[p.source]}
        />
        <span className="text-[11.5px] text-content">{p.title}</span>
      </label>
    ))}

    <p className="text-[10px] cc-caps mt-3.5 mb-2">Columns</p>
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
        <span className="text-[11.5px] text-content">
          {colLabel(c, groupNoun)}
        </span>
      </label>
    ))}
  </div>
);

export default CustomConfig;
