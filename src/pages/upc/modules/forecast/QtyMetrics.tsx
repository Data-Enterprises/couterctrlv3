import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../hooks";
import MetricCard from "./MetricCard";
import type { UpcMetrics } from "../../../../interfaces";
import {
  getOverallMetrics,
  reducePriceHistory,
  // getItemMetrics,
  // getForecast,
} from "../../components";

type MetricKey =
  | "active"
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
    const upcs = state.forecastQtyData.filter((upc) =>
      state.selectedUpcs.includes(upc.product_code),
    );

    const qtySorted = [...upcs].sort(
      (a, b) =>
        reducePriceHistory(b.data.metrics.prices) -
        reducePriceHistory(a.data.metrics.prices),
    );
    const topItem = qtySorted[0];
    const bottomItem = qtySorted[qtySorted.length - 1];

    setMetrics(getOverallMetrics(upcs, topItem, bottomItem));
  }, [state.forecastQtyData, state.selectedLegendForecast, state.selectedUpcs]);

  return (
    <>
      {state.selectedUpcs.length > 0 ? (
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
      ) : null}
    </>
  );
};

export default QtyMetrics;
