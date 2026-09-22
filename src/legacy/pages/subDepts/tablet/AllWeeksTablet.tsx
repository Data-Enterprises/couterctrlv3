import { formatDate } from "../display/allWeeks";
import { setDates } from "..";
import { useSubMarginCtx } from "../hooks";
import WeekOverviewTablet from "./WeekOverviewTablet";

const AllWeeksTablet = () => {
  const ctx = useSubMarginCtx();

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
      className="grid gap-4"
    >
      <WeekOverviewTablet week={1} dates={dates(1)} data={ctx.weekOneMargins} />
      <WeekOverviewTablet week={2} dates={dates(2)} data={ctx.weekTwoMargins} />
      <WeekOverviewTablet week={3} dates={dates(3)} data={ctx.weekThreeMargins} />
      <WeekOverviewTablet week={4} dates={dates(4)} data={ctx.weekFourMargins} />
    </div>
  );
};

export default AllWeeksTablet;
