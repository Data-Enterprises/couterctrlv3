import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../hooks";
import MetricCard from "./MetricCard";
import type { UpcMetrics } from "../../../../interfaces";
import {
  getOverallMetrics,
  getItemMetrics,
  getForecast,
} from "../../components";

interface QtyMetricsProps {
  mode: "overall" | "top" | "selected";
  metric: "Quantity" | "Sales";
}

type MetricKey =
  | "active"
  | "forecast"
  | "quantity"
  | "qtyRange"
  | "mdq"
  | "median"
  | "avgQty"
  | "avgQtyRange";

const QtyMetrics = ({ mode, metric }: QtyMetricsProps) => {
  const state = useAppSelector((state) => state.upc);
  const [metrics, setMetrics] = useState<
    { label: string; value: number; item?: UpcMetrics | null; type: string }[]
  >([]);
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    // Grabbing the top and bottom items for overall metrics for qty
    const topItem = [...state.upcList].sort(
      (a, b) => b.metrics.qty - a.metrics.qty
    )[0];
    const bottomItem = [...state.upcList].sort(
      (a, b) => a.metrics.qty - b.metrics.qty
    )[0];

    if (mode === "overall") {
      setTitle(`${metric} Overview`);
      setMetrics(getOverallMetrics(state.upcList, topItem, bottomItem));

    } else if (mode === "selected") {
      // Handling the default behavior as well for on mount
      const item = state.selectedLegendForecast.label
        ? state.selectedLegendForecast
        : state.upcList[0];
      const itemForecast = getForecast(state.forecast, item);
      setTitle(`${item.metrics.description} - (${item.label})`);
      setMetrics(getItemMetrics(item, itemForecast));
    }
  }, [state.upcList, state.selectedLegendForecast, mode]);

  return (
    <>
      <div className="font-medium text-center mb-1">{title}</div>
      <div className="grid grid-cols-5 gap-2 w-full">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            metric={metric.value}
            label={metric.label}
            type={metric.type as MetricKey}
            mode={mode}
          />
        ))}
      </div>
    </>
  );
};

export default QtyMetrics;
