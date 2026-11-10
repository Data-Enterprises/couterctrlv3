// Utils
import { MARKDOWN_COLUMNS } from "../../utils";

// Interfaces
import type { MarkdownSortKey } from "../../../../../interfaces/markdowns";

interface ColumnPickerProps {
  chosen: Set<MarkdownSortKey>;
  onToggle: (key: MarkdownSortKey) => void;
  onAll: (all: boolean) => void;
}

/** The columns the CSV will hold, one checkbox each, in the grid's order. */
const ColumnPicker = ({ chosen, onToggle, onAll }: ColumnPickerProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium flex-1">
        Columns · {chosen.size} of {MARKDOWN_COLUMNS.length}
      </p>
      <button
        type="button"
        onClick={() => onAll(true)}
        className="text-[11px] font-semibold text-brand_navy hover:underline"
      >
        All
      </button>
      <button
        type="button"
        onClick={() => onAll(false)}
        className="text-[11px] font-semibold text-brand_navy hover:underline"
      >
        None
      </button>
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {MARKDOWN_COLUMNS.map((c) => (
        <label
          key={c.key}
          className="flex items-center gap-2 cursor-pointer text-[12px] text-content"
        >
          <input
            type="checkbox"
            checked={chosen.has(c.key)}
            onChange={() => onToggle(c.key)}
            className="h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
          />
          {c.label}
        </label>
      ))}
    </div>
  </div>
);

export default ColumnPicker;
