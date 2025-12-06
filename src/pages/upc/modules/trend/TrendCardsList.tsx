import { useState, useEffect } from "react";
import { useAppSelector } from "../../../../hooks";
import type { UpcTrend } from "../../../../interfaces";
import TrendCard from "./TrendCard";
import MetricsCarousel from "../forecast/MetricsCarousel";

const TrendCardsList = () => {
  const [trends, setTrends] = useState<UpcTrend[]>([]);
  const state = useAppSelector((state) => state.upc);

  useEffect(() => {
    if (state.selectedUpcs.length) {
      const filteredTrends = state.upcTrends.filter((trend) =>
        state.selectedUpcs.includes(trend.product_code)
      );
      setTrends(filteredTrends);
    }
  }, [state.selectedUpcs]);

  const chunkTrends = (arr: UpcTrend[], chunkSize: number) => {
    const chunks: UpcTrend[][] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const trendChunks = chunkTrends(trends, 5);

  return (
    <div>
      <MetricsCarousel className="h-full">
        {trendChunks.map((chunk, idx) => (
          <div key={idx} className="grid grid-cols-5 gap-1">
            {chunk.map((trend, i) => (
              <TrendCard id={i} key={trend.product_code || i} trend={trend} />
            ))}
          </div>
        ))}
      </MetricsCarousel>
    </div>
  );
};

export default TrendCardsList;
