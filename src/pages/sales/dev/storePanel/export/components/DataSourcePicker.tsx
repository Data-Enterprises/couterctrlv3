import type { CustomSource } from "../types/index";

interface DataSourcePickerProps {
  source: CustomSource;
  onChange: (source: CustomSource) => void;
}

const DataSourcePicker = ({ source, onChange }: DataSourcePickerProps) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
      Data Source
    </p>
    <div className="flex flex-col gap-1.5">
      {(["subdept", "hourly"] as CustomSource[]).map((s) => (
        <label key={s} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={source === s}
            onChange={() => onChange(s)}
            className="accent-brand_navy h-3.5 w-3.5"
          />
          <span className="text-[12px] text-content">
            {s === "subdept" ? "Sub Department" : "Hourly"}
          </span>
        </label>
      ))}
    </div>
  </div>
);

export default DataSourcePicker;
