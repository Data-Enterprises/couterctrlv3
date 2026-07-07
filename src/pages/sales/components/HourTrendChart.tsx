import { ResponsiveLine } from "@nivo/line";
import { formatCurrency2 } from "../../../utils";

interface HourTrendChartProps {
  days: { label: string; tw: number; lw: number; ly: number }[];
  hasLW: boolean;
  hasLY: boolean;
}

const HourTrendChart = ({ days, hasLW, hasLY }: HourTrendChartProps) => {
  const lineData = [
    { id: "TY", data: days.map((d) => ({ x: d.label, y: d.tw })), color: "#1e2a4a" },
    ...(hasLW ? [{ id: "LW", data: days.map((d) => ({ x: d.label, y: d.lw })), color: "#f59e0b" }] : []),
    ...(hasLY ? [{ id: "LY", data: days.map((d) => ({ x: d.label, y: d.ly })), color: "#3b82f6" }] : []),
  ];

  return (
    <div style={{ height: 200 }}>
      <ResponsiveLine
        data={lineData}
        margin={{ top: 30, right: 24, bottom: 24, left: 48 }}
        yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
        curve="monotoneX"
        useMesh={true}
        enableArea={false}
        enableGridX={false}
        enableGridY={true}
        colors={lineData.map((s) => s.color)}
        lineWidth={2}
        pointSize={7}
        pointColor={{ from: "color" }}
        pointBorderWidth={2}
        pointBorderColor={{ theme: "background" }}
        axisBottom={{ tickSize: 4, tickPadding: 6, tickRotation: 0 }}
        axisLeft={{
          tickSize: 4,
          tickValues: 4,
          tickRotation: 0,
          format: (value) => formatCurrency2(value as number).split(".")[0],
        }}
        legends={[
          {
            anchor: "top",
            direction: "row",
            justify: true,
            translateX: -8,
            translateY: -22,
            itemsSpacing: 12,
            itemDirection: "left-to-right",
            itemWidth: 34,
            itemHeight: 3,
            itemOpacity: 0.9,
            symbolSize: 8,
            symbolShape: "circle",
            effects: [],
          },
        ]}
        tooltip={({ point }) => (
          <div className="bg-[rgb(30,45,80)] text-custom-white px-2 py-1 text-[10px] rounded shadow">
            {point.seriesId} · {String(point.data.x)}: {formatCurrency2(point.data.y as number)}
          </div>
        )}
        theme={{
          text: { fontSize: 10, fill: "#6b7280" },
          grid: { line: { stroke: "#e5e7eb", strokeWidth: 1 } },
        }}
      />
    </div>
  );
};

export default HourTrendChart;
