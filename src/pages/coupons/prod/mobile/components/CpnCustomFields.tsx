// Utils
import { DIMS, METRICS, AGG_OPTIONS } from "../../utils";

// Interfaces
import type { AggFn } from "../../../../../utils/csvExport";
import type { MetricSelection } from "../../interfaces";

interface CpnCustomFieldsProps {
  groupBy: Set<string>;
  onToggleGroupBy: (key: string) => void;
  metrics: Map<string, MetricSelection>;
  onToggleMetric: (key: string) => void;
  onMetricFn: (key: string, fn: AggFn) => void;
}

/** The phone export's Group By and Metrics choices. */
const CpnCustomFields = ({
  groupBy,
  onToggleGroupBy,
  metrics,
  onToggleMetric,
  onMetricFn,
}: CpnCustomFieldsProps) => (
  <>
    <div>
      <div className="text-[10px] cc-caps mb-2">Group By</div>
      <div className="space-y-2">
        {DIMS.map((d) => (
          <label key={d.key} className="flex items-center gap-2">
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
      <div className="text-[10px] cc-caps mb-2">Metrics</div>
      <div className="space-y-2">
        {METRICS.map((m) => {
          const sel = metrics.get(m.key)!;
          return (
            <div key={m.key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={sel.enabled}
                onChange={() => onToggleMetric(m.key)}
                className="cc-checkbox flex-shrink-0"
              />
              <span
                className={`text-[12px] flex-1 ${sel.enabled ? "text-content" : "text-content/95"}`}
              >
                {m.label}
              </span>
              <select
                value={sel.fn}
                disabled={!sel.enabled}
                onChange={(e) => onMetricFn(m.key, e.target.value as AggFn)}
                className="text-[10px] border border-line_field rounded px-1 py-1 text-content disabled:opacity-40 bg-custom-white outline-none"
              >
                {AGG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  </>
);

export default CpnCustomFields;
