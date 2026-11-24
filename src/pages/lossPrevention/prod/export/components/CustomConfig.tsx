// Utils
import { AGG_OPTIONS } from "../utils";

// Interfaces
import type { AggFn } from "../../../../../utils/csvExport";
import type {
  CustomSource,
  DimDef,
  MetricDef,
  MetricSelection,
} from "../interfaces";

interface CustomConfigProps {
  source: CustomSource;
  onSource: (source: CustomSource) => void;
  dims: DimDef[];
  groupBy: Set<string>;
  onToggleGroupBy: (key: string) => void;
  mDefs: MetricDef[];
  metrics: Map<string, MetricSelection>;
  onToggleMetric: (key: string) => void;
  onMetricFn: (key: string, fn: AggFn) => void;
}

/** Custom mode's left column: the data source, what to group by, and the
 *  metrics with how each one combines. */
const CustomConfig = ({
  source,
  onSource,
  dims,
  groupBy,
  onToggleGroupBy,
  mDefs,
  metrics,
  onToggleMetric,
  onMetricFn,
}: CustomConfigProps) => (
  <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
    {/* Source */}
    <div>
      <p className="text-[10px] cc-caps mb-2">Data Source</p>
      <div className="flex flex-col gap-1.5">
        {(["transactions", "cashiers"] as CustomSource[]).map((s) => (
          <label key={s} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={source === s}
              onChange={() => onSource(s)}
              className="accent-brand_navy h-3.5 w-3.5"
            />
            <span className="text-[12px] text-content capitalize">
              {s === "transactions" ? "Transaction List" : "Cashier Summary"}
            </span>
          </label>
        ))}
      </div>
    </div>

    {/* Group by */}
    <div>
      <p className="text-[10px] cc-caps mb-2">Group By</p>
      <div className="space-y-1.5">
        {dims.map((d) => (
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

    {/* Metrics */}
    <div>
      <p className="text-[10px] cc-caps mb-2">Metrics</p>
      <div className="space-y-2">
        {mDefs.map((m) => {
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
        })}
      </div>
    </div>
  </div>
);

export default CustomConfig;
