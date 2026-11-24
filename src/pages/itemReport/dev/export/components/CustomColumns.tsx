// Utils
import { COLS, SOURCE_LABEL } from "../utils";

// Interfaces
import type { Row, Source } from "../interfaces";

interface CustomColumnsProps {
  source: Source;
  onSource: (source: Source) => void;
  rowsOf: Record<Source, Row[]>;
  /** The ticked columns of the chosen source. */
  picked: Set<string>;
  onToggleCol: (key: string) => void;
}

/** Custom mode's left column: the data source, then its columns. The source
 *  list stays put and only the column list scrolls, so the radios never
 *  scroll away and the download stays on screen. */
const CustomColumns = ({
  source,
  onSource,
  rowsOf,
  picked,
  onToggleCol,
}: CustomColumnsProps) => (
  <div className="p-3.5 border-r border-line_hair flex flex-col min-h-0">
    <p className="text-[10px] cc-caps mb-2">Data source</p>
    {SOURCE_LABEL.map(({ key, label }) => (
      <label
        key={key}
        className={`flex items-center gap-1.5 mb-1.5 cursor-pointer ${
          rowsOf[key].length > 0 ? "" : "opacity-40"
        }`}
      >
        <input
          type="radio"
          checked={source === key}
          onChange={() => onSource(key)}
          disabled={rowsOf[key].length === 0}
        />
        <span className="text-[11.5px] text-content">{label}</span>
      </label>
    ))}

    <p className="text-[10px] cc-caps mt-3.5 mb-2 flex-shrink-0">Columns</p>
    <div className="cc-scroll pr-1">
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
  </div>
);

export default CustomColumns;
