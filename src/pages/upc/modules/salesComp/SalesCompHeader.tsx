import { useEffect, useState } from "react";
import { useUpcContext } from "../../wizard/hooks";
import WeekCard from "./WeekCard";
import type { CardData } from ".";

const SalesCompHeader = () => {
  const context = useUpcContext();
  const [cards, setCards] = useState<CardData[]>([]);

  useEffect(() => {
    // Grabbing only the selected UPCs
    const selected = context.salesComp.filter((item) =>
      context.selectedUpcs.includes(item.product_code)
    );

    // Then grouping the sales data by the week of properties of the selected upcs
    const aggregated = selected.reduce((acc: CardData[], cur) => {
      const existing = acc.find((item) => item.week === cur.week);
      if (existing) {
        // Update existing entry
        existing.sales.Monday! += cur.Monday || 0;
        existing.sales.Tuesday! += cur.Tuesday || 0;
        existing.sales.Wednesday! += cur.Wednesday || 0;
        existing.sales.Thursday! += cur.Thursday || 0;
        existing.sales.Friday! += cur.Friday || 0;
        existing.sales.Saturday! += cur.Saturday || 0;
        existing.sales.Sunday! += cur.Sunday || 0;
      } else {
        // Create new entry
        acc.push({
          week: cur.week,
          sales: {
            Monday: cur.Monday || 0,
            Tuesday: cur.Tuesday || 0,
            Wednesday: cur.Wednesday || 0,
            Thursday: cur.Thursday || 0,
            Friday: cur.Friday || 0,
            Saturday: cur.Saturday || 0,
            Sunday: cur.Sunday || 0,
          },
        });
      }
      return acc;
    }, []);
    setCards(aggregated);
  }, [context.salesComp, context.selectedUpcs]);

  return (
    <div className="grid grid-cols-7 gap-4">
      {cards.map((card, i) => (
        <WeekCard key={i} week={card.week} sales={card.sales} />
      ))}
    </div>
  );
};

export default SalesCompHeader;
