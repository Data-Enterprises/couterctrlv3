import { useSubMarginCtx } from "../hooks";
import WeekCard from "./WeekCard";

const WeeklyTrends = () => {
  const ctx = useSubMarginCtx();
  return (
    <div className="grid grid-cols-2 gap-2">
      <WeekCard data={ctx.weekOneMargins} />
      <WeekCard data={ctx.weekTwoMargins} />
      <WeekCard data={ctx.weekThreeMargins} />
      <WeekCard data={ctx.weekFourMargins} />
    </div>
  );
};

export default WeeklyTrends;
