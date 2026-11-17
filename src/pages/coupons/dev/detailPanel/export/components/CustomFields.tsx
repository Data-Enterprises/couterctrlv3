// Utils
import { DIMS, METRICS } from "../../../utils";

// Interfaces
import type { AggFn } from "../../../../../../utils/csvExport";
import type { MetricSelection } from "../../../interfaces";

// Components
import MetricRow from "./MetricRow";

interface CustomFieldsProps {
  groupBy: Set<string>;
  onToggleGroupBy: (key: string) => void;
  metrics: Map<string, MetricSelection>;
  onToggleMetric: (key: string) => void;
  onMetricFn: (key: string, fn: AggFn) => void;
}

/** Custom mode's Group By and Metrics choices. */
const CustomFields = ({
  groupBy,
  onToggleGroupBy,
  metrics,
  onToggleMetric,
  onMetricFn,
}: CustomFieldsProps) => (
  <>
    <div>
      <p className="text-[10px] cc-caps mb-2">Group By</p>
      <div className="space-y-1.5">
        {DIMS.map((d) => (
          <label key={d.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={groupBy.has(d.key)}
              onChange={() => onToggleGroupBy(d.key)}
              className="cc-checkbox flex-shrink-0"
            />
            <span className="text-[12px] text-content">{d.label}</span>
          </label>
        ))}
      </div>
    </div>
    <div>
      <p className="text-[10px] cc-caps mb-2">Metrics</p>
      <div className="space-y-2">
        {METRICS.map((m) => {
          const sel = metrics.get(m.key)!;
          return (
            <MetricRow
              key={m.key}
              label={m.label}
              enabled={sel.enabled}
              fn={sel.fn}
              onToggle={() => onToggleMetric(m.key)}
              onFn={(fn) => onMetricFn(m.key, fn)}
            />
          );
        })}
      </div>
    </div>
  </>
);

export default CustomFields;
