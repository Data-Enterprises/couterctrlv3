import { ResponsiveLine } from "@nivo/line";
import { formatCurrencyCompact } from "../../utils";
import type { DayTotal } from "./trackerTotals";

interface WeekLineProps {
  days: DayTotal[];
}

/** Navy for this year, a lighter tint of the same hue for last year.
 *  Deliberately not the severity green/red: the lines are two periods, not two
 *  verdicts, and colouring them by sentiment would say a period is good or bad
 *  before the comparison has been made. */
const TY_COLOR = "#1e2a4a";
const LY_COLOR = "#7f9cc0";

const dow = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });

/**
 * This year against last year, day by day, for one week.
 *
 * `@nivo/line`, the same library the legacy tracker's `CardLine` used, so the
 * chart in the rebuilt page behaves like the one people already know.
 *
 * Days with no last-year figure are plotted as gaps rather than zeros —
 * `null` in a nivo series breaks the line instead of dropping it to the floor,
 * which is the honest rendering of "no comparison" and stops a missing day
 * looking like a day of no trade.
 */
const WeekLine = ({ days }: WeekLineProps) => {
  const data = [
    {
      id: "LY Sales",
      color: LY_COLOR,
      data: days.map((d) => ({ x: dow(d.date), y: d.salesLy })),
    },
    {
      id: "TY Sales",
      color: TY_COLOR,
      data: days.map((d) => ({ x: dow(d.date), y: d.salesTy })),
    },
  ];

  return (
    <div className="h-[152px] w-full">
      <ResponsiveLine
        data={data}
        colors={{ datum: "color" }}
        margin={{ top: 10, right: 12, bottom: 26, left: 52 }}
        yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
        curve="monotoneX"
        enableArea={false}
        enableGridX={false}
        lineWidth={2}
        pointSize={6}
        pointBorderWidth={0}
        pointColor={{ from: "color" }}
        useMesh
        axisTop={null}
        axisRight={null}
        axisBottom={{ tickSize: 0, tickPadding: 8 }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 6,
          tickValues: 4,
          format: (v) => formatCurrencyCompact(Number(v)),
        }}
        theme={{
          text: { fontSize: 10, fill: "#4a5a6e" },
          axis: { ticks: { text: { fontSize: 10, fill: "#4a5a6e" } } },
          grid: { line: { stroke: "#e8ecee", strokeWidth: 1 } },
          tooltip: { container: { fontSize: 12 } },
        }}
        legends={[
          {
            anchor: "top-right",
            direction: "row",
            translateY: -14,
            itemWidth: 78,
            itemHeight: 12,
            symbolSize: 8,
            symbolShape: "circle",
            itemTextColor: "#4a5a6e",
          },
        ]}
      />
    </div>
  );
};

export default WeekLine;
