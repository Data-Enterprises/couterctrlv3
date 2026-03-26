import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../hooks";
import MetricCard from "./MetricCard";
import type { UpcMetrics } from "../../../../interfaces";
import {
  getOverallMetrics,
  // getItemMetrics,
  // getForecast,
} from "../../components";

type MetricKey =
  | "active"
  | "forecast"
  | "quantity"
  | "qtyRange"
  | "mdq"
  | "median"
  | "avgQty"
  | "avgQtyRange";

const QtyMetrics = () => {
  const state = useAppSelector((state) => state.upc);
  const [metrics, setMetrics] = useState<
    { label: string; value: number; item?: UpcMetrics | null; type: string }[]
  >([]);

  useEffect(() => {
    // Grabbing the top and bottom items for overall metrics for qty
    const topItem = [...state.upcList].sort(
      (a, b) => b.metrics.qty - a.metrics.qty,
    )[0];
    const bottomItem = [...state.upcList].sort(
      (a, b) => a.metrics.qty - b.metrics.qty,
    )[0];

    setMetrics(getOverallMetrics(state.upcList, topItem, bottomItem));
  }, [state.upcList, state.selectedLegendForecast]);

  return (
    <>
      <div className="grid grid-cols-5 gap-2 w-full">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            metric={metric.value}
            label={metric.label}
            type={metric.type as MetricKey}
          />
        ))}
      </div>
    </>
  );
};

export default QtyMetrics;
