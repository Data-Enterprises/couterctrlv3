import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../hooks";
import MetricCard from "./MetricCard";
import { UpcMetrics } from "../../../features/upcListSlice";
import { getOverallMetrics, getItemMetrics, getForecast } from "./utils";

interface QtyMetricsProps {
  mode: "overall" | "top" | "selected";
  metric: "Quantity" | "Sales";
}

const QtyMetrics = ({ mode, metric }: QtyMetricsProps) => {
  const state = useAppSelector((state) => state.upc);
  const [metrics, setMetrics] = useState<
    { label: string; value: number; item?: UpcMetrics | null; type: string }[]
  >([]);
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    const topItem = [...state.upcList].sort(
      (a, b) => b.metrics.qty - a.metrics.qty
    )[0];
    const bottomItem = [...state.upcList].sort(
      (a, b) => a.metrics.qty - b.metrics.qty
    )[0];

    if (mode === "overall") {
      setTitle(`${metric} Overview - ${state.upcList.length} Items`);
      setMetrics(getOverallMetrics(state.upcList, topItem, bottomItem));
    } else if (mode === "top") {
      const topForecast = getForecast(state.forecast, topItem);

      setTitle(`Top Item - ${topItem.metrics.description} (${topItem.label})`);
      setMetrics(getItemMetrics(topItem, topForecast));
    } else if (mode === "selected") {
      const item = state.selectedLegendForecast || state.upcList[0];
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
            item={metric.item}
            type={metric.type}
          />
        ))}
      </div>
    </>
  );
};

export default QtyMetrics;
