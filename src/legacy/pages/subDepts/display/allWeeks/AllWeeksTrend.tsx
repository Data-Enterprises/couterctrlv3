import { formatDate } from ".";
import { setDates } from "../..";
import { useSubMarginCtx, useHeight } from "../../hooks";
import WeekOverview from "./WeekOverview";

const AllWeeksTrend = () => {
  const ctx = useSubMarginCtx();
  const height = useHeight();

  const dates = (week: number) => {
    let start = "";
    let end = "";

    if (week === 1) {
      start = formatDate(setDates(new Date(ctx.singleDate), 6));
      end = formatDate(setDates(new Date(ctx.singleDate)));
    } else if (week === 2) {
      start = formatDate(setDates(new Date(ctx.singleDate), 13));
      end = formatDate(setDates(new Date(ctx.singleDate), 7));
    } else if (week === 3) {
      start = formatDate(setDates(new Date(ctx.singleDate), 20));
      end = formatDate(setDates(new Date(ctx.singleDate), 14));
    } else {
      start = formatDate(setDates(new Date(ctx.singleDate), 27));
      end = formatDate(setDates(new Date(ctx.singleDate), 21));
    }
    return `${start} - ${end}`;
  };

  return (
    <div
      className={`grid grid-cols-2 grid-rows-2 ${height} gap-2 overflow-hidden p-2`}
    >
      <WeekOverview week={1} dates={dates(1)} data={ctx.weekOneMargins} />
      <WeekOverview week={2} dates={dates(2)} data={ctx.weekTwoMargins} />
      <WeekOverview week={3} dates={dates(3)} data={ctx.weekThreeMargins} />
      <WeekOverview week={4} dates={dates(4)} data={ctx.weekFourMargins} />
    </div>
  );
};

export default AllWeeksTrend;
