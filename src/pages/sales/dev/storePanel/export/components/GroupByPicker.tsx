import type { DimDef } from "../types/index";

interface GroupByPickerProps {
  dims: DimDef[];
  groupBy: Set<string>;
  onToggle: (key: string) => void;
}

const GroupByPicker = ({ dims, groupBy, onToggle }: GroupByPickerProps) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
      Group By
    </p>
    <div className="space-y-1.5">
      {dims.map((d) => (
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

export default GroupByPicker;
