// Utils
import { AGG_OPTIONS } from "../../../utils";

// Interfaces
import type { AggFn } from "../../../../../../utils/csvExport";

interface MetricRowProps {
  label: string;
  enabled: boolean;
  fn: AggFn;
  onToggle: () => void;
  onFn: (fn: AggFn) => void;
}

/** One metric in the Custom export: on or off, and how it is combined. */
const MetricRow = ({ label, enabled, fn, onToggle, onFn }: MetricRowProps) => (
  <div className="flex items-center gap-1.5">
    <input
      type="checkbox"
      checked={enabled}
      onChange={onToggle}
      className="cc-checkbox flex-shrink-0"
    />
    <span
      className={`text-[12px] flex-1 ${enabled ? "text-content" : "text-content/95"}`}
    >
      {label}
    </span>
    <select
      value={fn}
      disabled={!enabled}
      onChange={(e) => onFn(e.target.value as AggFn)}
      className="text-[10px] cc-field-sm disabled:opacity-30"
      style={{ minWidth: 52 }}
    >
      {AGG_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export default MetricRow;
