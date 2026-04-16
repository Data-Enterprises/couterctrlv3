import { useMobileSalesCtx } from "../hooks";
import { ResponsiveBar } from "@nivo/bar";
import { formatCurrency2 } from "../../../../utils";

const colors = [
  "#00CC55",
  "#0099AA",
  "#0066FF",
  "#3b82f6",
  "#6688FF",
  "#FF9900",
  "#CC8844",
];

interface SalesViewWeeklyProps {
  displayName: string;
}

const SalesViewWeekly = ({ displayName }: SalesViewWeeklyProps) => {
  const ctx = useMobileSalesCtx();

  const formatId = (id: string) => {
    return id.split("/").slice(0, 2).join("/");
  };

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-md px-2 py-0.5">
      <div className="flex justify-between font-medium">
        <div>Weekly Sales</div>
        <div>{displayName}</div>
      </div>
      <div className="grid grid-cols-2 mb-1">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div className="grid grid-cols-[30.5%_69.5%]">
        <div>
          {ctx.salesViewWeekly.map((item, i) => (
            <div key={i} className="flex gap-1 items-center">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              ></div>
              <div className="font-medium">{formatCurrency2(item.value)}</div>
            </div>
          ))}
        </div>
        <div className="h-full">
          <ResponsiveBar
            data={ctx.salesViewWeekly}
            margin={{ top: -5, right: 0, bottom: 30, left: 0 }}
            enableLabel={false}
            colors={(d) => rgbaColor(colors[d.index % colors.length], 0.3)}
            padding={0.1}
            borderRadius={4}
            borderWidth={2}
            axisLeft={null}
            axisBottom={{
              renderTick: ({ x, y, textX, textY, value }) => {
                const dow = new Date(value as string)
                  .toDateString()
                  .split(" ")[0];
                return (
                  <g transform={`translate(${x},${y + 4})`}>
                    <line
                      x1={0}
                      y1={-4}
                      x2={0}
                      y2={1.5}
                      stroke="black"
                      strokeWidth={0.5}
                    />
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
                      <tspan x={0} dy={typeof value === "number" ? 4 : 12}>
                        {formatId(value as string)}
                      </tspan>
                    </text>
                  </g>
                );
              },
            }}
            borderColor={(d) => rgbaColor(colors[d.index % colors.length], 1)}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesViewWeekly;
