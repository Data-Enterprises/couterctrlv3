// Utils
import { AGG_OPTIONS, type AggFn } from "../../../../../utils/csvExport";
import { CPN_SALES_DIMS, CPN_SALES_METRICS, SCOPE_OPTIONS } from "../utils";

// Interfaces
import type { Scope } from "../interfaces";

interface CustomConfigProps {
  scope: Scope;
  onScope: (scope: Scope) => void;
  groupBy: Set<string>;
  onToggleDim: (key: string) => void;
  metrics: Map<string, { fn: AggFn; enabled: boolean }>;
  onToggleMetric: (key: string) => void;
  onMetricFn: (key: string, fn: AggFn) => void;
}

/** Custom mode's left column: the store scope, the group-by fields and the
 *  metrics with their functions. */
const CustomConfig = ({
  scope,
  onScope,
  groupBy,
  onToggleDim,
  metrics,
  onToggleMetric,
  onMetricFn,
}: CustomConfigProps) => (
  <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
    <div>
      <p className="text-[10px] cc-caps mb-2">Scope</p>
      <div className="flex flex-col gap-1.5">
        {SCOPE_OPTIONS.map((sc) => (
          <label
            key={sc.key}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              checked={scope === sc.key}
              onChange={() => onScope(sc.key)}
              className="accent-brand_navy h-3.5 w-3.5"
            />
            <span className="text-[12px] text-content">{sc.label}</span>
          </label>
        ))}
      </div>
    </div>

    <div>
      <p className="text-[10px] cc-caps mb-2">Group By</p>
      <div className="space-y-1.5">
        {CPN_SALES_DIMS.map((d) => (
          <label key={d.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={groupBy.has(d.key)}
              onChange={() => onToggleDim(d.key)}
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
        {CPN_SALES_METRICS.map((m) => {
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
