// Utils
import { ITEM_DIMS } from "../utils";

interface GroupByPickerProps {
  groupBy: Set<string>;
  onToggle: (key: string) => void;
}

/** The custom export's group-by columns. */
const GroupByPicker = ({ groupBy, onToggle }: GroupByPickerProps) => {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
        Group By
      </p>
      <div className="space-y-1.5">
        {ITEM_DIMS.map((d) => (
          <label key={d.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={groupBy.has(d.key)}
              onChange={() => onToggle(d.key)}
              className="accent-brand_navy h-3.5 w-3.5 rounded flex-shrink-0"
            />
            <span className="text-[12px] text-content">{d.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default GroupByPicker;
