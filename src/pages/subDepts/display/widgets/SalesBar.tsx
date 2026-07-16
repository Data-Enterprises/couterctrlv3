import { useSubMarginCtx } from "../../hooks";
import { ResponsiveBar, type BarDatum } from "@nivo/bar";
import { setDates } from "../..";
import { formatDate, type BarData } from ".";
import { formatCurrency2 } from "../../../../utils";

interface SalesBarProps {
  barData: BarData[];
}

const SalesBar = ({ barData }: SalesBarProps) => {
  const ctx = useSubMarginCtx();

  const max = Math.max(...barData.map((data) => data.sales));

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const showWeekRange = () => {
    const end = setDates(new Date(ctx.singleDate), 0);
    const start = setDates(new Date(ctx.singleDate), 6);
    let wkStart = "",
      wkEnd = "";

    switch (ctx.selectedWeek) {
      case 1:
        return `${formatDate(start)} - ${formatDate(end)}`;
      case 2:
        wkEnd = setDates(new Date(ctx.singleDate), 7);
        wkStart = setDates(new Date(ctx.singleDate), 13);
        return `${formatDate(wkStart)} - ${formatDate(wkEnd)}`;
      case 3:
        wkEnd = setDates(new Date(ctx.singleDate), 14);
        wkStart = setDates(new Date(ctx.singleDate), 20);
        return `${formatDate(wkStart)} - ${formatDate(wkEnd)}`;
      case 4:
        wkEnd = setDates(new Date(ctx.singleDate), 21);
        wkStart = setDates(new Date(ctx.singleDate), 27);
        return `${formatDate(wkStart)} - ${formatDate(wkEnd)}`;
      case 5:
        return "All Weeks";
    }
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      <div className="font-medium text-[13px] px-2 py-0.5 rounded-t-lg flex justify-between items-center">
        <div>Daily Sales</div>
        <div>{showWeekRange()}</div>
      </div>
      <div className="grid grid-cols-2 h-[1.5px]">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white"></div>
      </div>
      <ResponsiveBar
        data={barData as unknown as BarDatum[]}
        margin={{ top: 15, right: 15, bottom: 58, left: max > 9999 ? 65 : 50 }}
        indexBy={"date"}
        keys={["sales"]}
        colors={() => rgbaColor("#3b82f6", 0.3)}
        borderWidth={2}
        borderColor={() => "#3b82f6"}
        padding={0.1}
        borderRadius={5}
        gridYValues={5}
        axisLeft={{
          tickValues: 5,
          style: {
            domain: {
              line: { stroke: "#3b82f6", strokeWidth: 1.5 },
            },
            ticks: {
              text: { fontSize: 11, strokeWidth: 2, fontWeight: "bolder" },
            },
          },
          format: (value) => formatCurrency2(value as number).split(".")[0],
        }}
        axisBottom={{
          style: {
            domain: {
              line: { stroke: "#3b82f6", strokeWidth: 1.5 },
            },
            ticks: {
              text: { fontSize: 11, strokeWidth: 2, fontWeight: "bolder" },
            },
          },
          // format: (value) =>
          //   value.split("/").slice(0, 2).join("/"),
          renderTick: ({ x, y, textX, textY, value }) => {
            const dow = new Date(value).toDateString().split(" ")[0];
            const datePart = value.split("/").slice(0, 2).join("/");
            return (
              <g transform={`translate(${x},${y + 4})`}>
                {/* the tick */}
                <line
                  x1={0}
                  y1={-4}
                  x2={0}
                  y2={1.5}
                  stroke="black"
                  strokeWidth={0.5}
                />
                {/* the text */}
                <text
                  textAnchor={"middle"}
                  transform={`translate(${textX},${textY + 2})`}
                  style={{
                    fontSize: 10.5,
                    fontWeight: "bolder",
                    fontFamily: "Arial",
                  }}
                >
                  <tspan x={0} dy={0}>
                    {dow}
                  </tspan>
                  <tspan x={0} dy={12}>
                    {datePart}
                  </tspan>
                </text>
              </g>
            );
          },
        }}
        enableLabel={false}
        enableGridX={false}
        tooltip={({ value, data }) => {
          const dow = new Date(data.date).toDateString().split(" ")[0];
          return (
            <div className="p-2 bg-custom-white shadow-lg rounded text-sm text-nowrap">
              <strong>
                {dow} {formatCurrency2(value)}
              </strong>
            </div>
          );
        }}
      />
    </div>
  );
};

export default SalesBar;
