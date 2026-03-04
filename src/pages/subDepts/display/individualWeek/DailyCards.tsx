import { useSubMarginCtx } from "../../hooks";
import DailyCard from "./DailyCard";

const DailyCards = () => {
  const ctx = useSubMarginCtx();

  const dates = Array.from(
    new Set(ctx.margins.map((margin) => margin.sale_date.split("T")[0])),
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="flex flex-col gap-2 min-h-[calc(100vh-10.5rem)] max-h-[calc(100vh-10.5rem)] overflow-y-auto no-scrollbar">
      {dates.map((d, i) => (
        <DailyCard key={i} date={d} />
      ))}
    </div>
  );
};

export default DailyCards;
