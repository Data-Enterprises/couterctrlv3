// Utils
import { SOURCE_LABEL } from "../utils";

// Interfaces
import type { CustomSource } from "../interfaces";

interface SourcePickerProps {
  source: CustomSource;
  onSource: (s: CustomSource) => void;
  vendorName: string;
}

/** Which week the custom export reads: this week, last week or last year. */
const SourcePicker = ({ source, onSource, vendorName }: SourcePickerProps) => {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
        Data Source
      </p>
      <div className="flex flex-col gap-1.5">
        {(["tw", "lw", "ly"] as CustomSource[]).map((s) => (
          <label key={s} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={source === s}
              onChange={() => onSource(s)}
              className="accent-brand_navy h-3.5 w-3.5"
            />
            <span className="text-[12px] text-content">{SOURCE_LABEL[s]}</span>
          </label>
        ))}
      </div>
      <p className="text-[10px] text-content mt-2 leading-relaxed">
        Items from {vendorName} only.
      </p>
    </div>
  );
};

export default SourcePicker;
