// Interfaces
import type { buildKpiMetrics } from "../utils";

// Components
import StripCell from "./StripCell";
import TrendBadge from "./TrendBadge";

interface StoreKpiStripProps {
  kpiMetrics: NonNullable<ReturnType<typeof buildKpiMetrics>>;
}

/** The store's four figures against its baseline; always on screen. */
const StoreKpiStrip = ({ kpiMetrics }: StoreKpiStripProps) => {
  return (
    <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
      {kpiMetrics.map((m) => (
        <StripCell
          key={m.label}
          label={m.label}
          value={m.value}
          baselineValue={m.baselineStr}
          badge={
            <TrendBadge
              current={m.current}
              trend={m.trendVal}
              useAbs={m.useAbs}
            />
          }
        />
      ))}
    </div>
  );
};

export default StoreKpiStrip;
