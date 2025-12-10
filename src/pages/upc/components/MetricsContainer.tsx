import { useState, useEffect } from "react";
import OptMetricCard from "./OptMetricCard";
import { priceOptTooltipInfo } from ".";

interface MetricsContainerProps<T> {
  data: T[];
  metricKey: keyof T;
  type: "Price" | "Qty" | "Rev";
}
const MetricsContainer = <T,>({
  data,
  metricKey,
  type,
}: MetricsContainerProps<T>) => {
  const [metrics, setMetrics] = useState<{ metric: number; label: string }[]>(
    []
  );

  useEffect(() => {
    setMetrics([
      {
        metric: data.length
          ? Math.max(...data.map((u) => u[metricKey] as number))
          : 0,
        label: `Max ${type}`,
      },
      {
        metric: data.length
          ? Math.max(...data.map((u) => u[metricKey] as number)) -
            Math.min(...data.map((u) => u[metricKey] as number))
          : 0,
        label: `${type} Range`,
      },
      {
        metric: data.length
          ? (() => {
              const sorted = data
                .map((u) => parseFloat(String(u[metricKey])) as number)
                .sort((a, b) => a - b);
              const mid = Math.floor(sorted.length / 2);
              return sorted.length % 2 !== 0
                ? sorted[mid]
                : (sorted[mid - 1] + sorted[mid]) / 2;
            })()
          : 0,
        label: `Median ${type}`,
      },
      {
        metric: data.length
          ? data.reduce(
              (acc, curr) =>
                acc + (parseFloat(String(curr[metricKey])) as number),
              0
            ) / (data.length === 0 ? 1 : data.length)
          : 0,
        label: `Avg ${type}`,
      },
      {
        metric: data.length
          ? Math.min(...data.map((u) => u[metricKey] as number))
          : 0,
        label: `Min ${type}`,
      },
    ]);
  }, [data]);

  return (
    <div className="grid grid-cols-5 gap-2">
      {metrics.map((m, i) => (
        <OptMetricCard
          key={i}
          metric={m.metric}
          label={m.label}
          type={type}
          info={priceOptTooltipInfo[type][i]}
          id={i}
        />
      ))}
    </div>
  );
};

export default MetricsContainer;
