// Utils
import { AGG_OPTIONS, ITEM_METRICS } from "../utils";

// Interfaces
import type { AggFn } from "../../../../../utils/csvExport";
import type { MetricSelection } from "../interfaces";

interface MetricsPickerProps {
  metrics: Map<string, MetricSelection>;
  onToggle: (key: string) => void;
  onFn: (key: string, fn: AggFn) => void;
}

/** The custom export's metrics, each with its sum / avg / min / max / count. */
const MetricsPicker = ({ metrics, onToggle, onFn }: MetricsPickerProps) => {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
        Metrics
      </p>
      <div className="space-y-2">
        {ITEM_METRICS.map((m) => {
          const sel = metrics.get(m.key)!;
          return (
            <div key={m.key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={sel.enabled}
                onChange={() => onToggle(m.key)}
                className="cc-checkbox flex-shrink-0"
              />
              <span className="text-[12px] flex-1 text-content">{m.label}</span>
              <select
                value={sel.fn}
                disabled={!sel.enabled}
                onChange={(e) => onFn(m.key, e.target.value as AggFn)}
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
};

export default MetricsPicker;
