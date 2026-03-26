import { useState, useEffect } from "react";
import { useAppSelector } from "../../../../hooks";
import type { UpcForecastData } from "../../../../interfaces";
import ForecastCard from "./ForecastCard";

const ForecastCardList = () => {
  const [filteredCards, setFilteredCards] = useState<UpcForecastData[][]>([]);
  const { forecastQtyData, selectedUpcs } = useAppSelector(
    (state) => state.upc,
  );

  useEffect(() => {
    const filtered = forecastQtyData.filter((card) =>
      selectedUpcs.includes(card.product_code),
    );
    const chunkedCards = () => {
      const chunk = 4;
      const result = [];
      for (let i = 0; i < filtered.length; i += chunk) {
        result.push(filtered.slice(i, i + chunk));
      }
      return result;
    };
    setFilteredCards(chunkedCards());
  }, [forecastQtyData, selectedUpcs]);

  return (
    <div className="w-full min-h-[78vh] max-h-[78vh] overflow-hidden overflow-y-scroll no-scrollbar space-y-2 text-sm">
      {filteredCards.map((chunk, index) => (
        <div key={index} className="grid grid-cols-4 gap-2">
          {chunk.map((card) => (
            <ForecastCard key={card.product_code} card={card} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ForecastCardList;
