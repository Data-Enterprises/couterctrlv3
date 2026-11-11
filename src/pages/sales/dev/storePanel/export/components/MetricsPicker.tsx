// Utils
import { AGG_OPTIONS } from "../utils/index";

// Interfaces
import type { AggFn } from "../../../../../../utils/csvExport";
import type { MetricDef, MetricSelection } from "../interfaces/index";

interface MetricsPickerProps {
  mDefs: MetricDef[];
  metrics: Map<string, MetricSelection>;
  onToggle: (key: string) => void;
  onFnChange: (key: string, fn: AggFn) => void;
}

/** The custom export's Metrics list: a checkbox per metric and a dropdown for how it is aggregated. */
const MetricsPicker = ({
  mDefs,
  metrics,
  onToggle,
  onFnChange,
}: MetricsPickerProps) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
      Metrics
    </p>
    <div className="space-y-2">
      {mDefs.map((m) => {
        const sel = metrics.get(m.key)!;
        return (
          <div key={m.key} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={sel.enabled}
              onChange={() => onToggle(m.key)}
              className="accent-brand_navy h-3.5 w-3.5 rounded flex-shrink-0"
            />
            <span className="text-[12px] flex-1 text-content">{m.label}</span>
            <select
              value={sel.fn}
              disabled={!sel.enabled}
              onChange={(e) => onFnChange(m.key, e.target.value as AggFn)}
              className="text-[10px] border border-line_field rounded px-1 py-0.5 text-content disabled:opacity-30 bg-custom-white outline-none"
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
      })}
    </div>
  </div>
);

export default MetricsPicker;
