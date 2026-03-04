import { useSubMarginCtx } from "../../hooks";
import DailyCard from "./DailyCard";

const DailyCards = () => {
  const ctx = useSubMarginCtx();

  const dates = Array.from(
    new Set(ctx.margins.map((margin) => margin.sale_date.split("T")[0])),
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
      {dates.map((d, i) => (
        <DailyCard key={i} date={d} />
      ))}
    </div>
  );
};

export default DailyCards;
