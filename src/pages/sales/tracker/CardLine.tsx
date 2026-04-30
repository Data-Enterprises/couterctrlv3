import type { WeekTotal } from "../../../features/salesSlice";
import { ResponsiveLine } from "@nivo/line";
import { formatCurrency2 } from "../../../utils";

interface CardLineProps {
  data: WeekTotal[];
}

const CardLine = ({ data }: CardLineProps) => {
  const getDOW = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const lineData = [
    {
      id: "TY Sales",
      data: data.map((week) => ({
        x: getDOW(week.sale_date),
        y: week.salesTY,
      })),
      color: "#10b981",
    },
    {
      id: "LY Sales",
      data: data.map((week) => ({
        x: getDOW(week.sale_date),
        y: week.salesLY,
      })),
      color: "#3b82f6",
    },
  ];

  return (
    <div className="h-full rounded-lg border border-content/15 shadow-md">
      <ResponsiveLine
        data={lineData}
        margin={{ top: 17, right: 17, bottom: 27, left: 55 }}
        yScale={{
          type: "linear",
          min: "auto",
          max: "auto",
          stacked: false,
        }}
        curve="monotoneX"
        useMesh={true}
        enableArea={false}
        enableGridX={true}
        enableGridY={false}
        colors={lineData.map((s) => s.color)}
        axisBottom={{
          tickSize: 4,
          tickPadding: 8,
          tickRotation: 0,
          legendOffset: 0,
        }}
        axisLeft={{
          tickSize: 4,
          tickValues: 5,
          tickRotation: 0,
          legendOffset: 0,
          format: (value) => formatCurrency2(value as number).split(".")[0],
        }}
        legends={[
          {
            anchor: "top",
            direction: "row",
            justify: true,
            translateX: -10,
            translateY: -10,
            itemsSpacing: 15,
            itemDirection: "left-to-right",
            itemWidth: 52,
            itemHeight: 3,
            itemOpacity: 0.9,
            symbolSize: 9,
            symbolShape: "circle",
            effects: [],
          },
        ]}
        tooltip={({ point }) => {
          // console.log(point);
          const id = point.seriesId;
          let margin = "";
          if (point.indexInSeries === 0) {
            margin = "ml-12";
          } else if (point.indexInSeries === data.length - 1) {
            margin = "mr-12";
          }
          return (
            <div
              className={`bg-[rgb(30,45,80)] text-custom-white px-2 py-1 text-[10px] rounded shadow text-nowrap ${margin}`}
            >
              {id}:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(point.data.y as number)}
            </div>
          );
        }}
        theme={{
          text: {
            fontSize: 10,
            fill: "#6b7280",
          },
          grid: {
            line: {
              stroke: "#e5e7eb",
              strokeWidth: 1,
            },
          },
          tooltip: {
            container: {
              background: "rgba(0, 0, 0, 0.8)",
              color: "#fff",
              fontSize: 10,
            },
          },
        }}
      />
    </div>
  );
};

export default CardLine;
