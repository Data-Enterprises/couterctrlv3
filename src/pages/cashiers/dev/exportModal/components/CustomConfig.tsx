// Utils
import { DIMS, METRICS } from "../../utils";

// Interfaces
import type { AggFn } from "../../../../../utils/csvExport";

// Components
import MetricRow from "./MetricRow";

interface CustomConfigProps {
  /** How many exception lines the export is built from. */
  lineCount: number;
  groupBy: Set<string>;
  onToggleGroupBy: (key: string) => void;
  metrics: Map<string, { fn: AggFn; enabled: boolean }>;
  onToggleMetric: (key: string) => void;
  onMetricFn: (key: string, fn: AggFn) => void;
}

/** Custom mode's left column: the data source, the group-by dimensions and
 *  the metrics. */
const CustomConfig = ({
  lineCount,
  groupBy,
  onToggleGroupBy,
  metrics,
  onToggleMetric,
  onMetricFn,
}: CustomConfigProps) => (
  <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
    <div>
      <p className="text-[10px] cc-caps mb-2">Data Source</p>
      <p className="text-[12px] text-content">Exception Lines</p>
      <p className="text-[10px] text-content/95 mt-0.5">{lineCount} rows</p>
    </div>

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
  </div>
);

export default CustomConfig;
