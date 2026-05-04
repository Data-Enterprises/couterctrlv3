import { useMobileSalesCtx } from "../hooks";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { formatCurrency2, sameWeekDayLastYear } from "../../../../utils";
import type { PieData } from "..";

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

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  const pieChartData: PieData[][] = [...ctx.weeklySales].map((item) => {
    const ly = sameWeekDayLastYear(item.sale_date);
    const found = ctx.weeklySalesLastYear.find(
      (s) => s.sale_date.split("T")[0] === ly.date,
    );
    const sales = found ? found.total_sales - found.total_tax : 0;
    return [
      {
        id: formatDate(item.sale_date),
        value: item.total_sales - item.total_tax,
      },
      {
        id: formatDate(ly.date),
        value: sales,
      },
    ];
  });

  const formatId = (id: string) => {
    return id.split("/").slice(0, 2).join("/");
  };

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const dow = (dte: string) => {
    return new Date(dte).toLocaleDateString("en-US", {
      weekday: "short",
    });
  };

  const activePieBg = (id: string) => {
    if (ctx.selectedStore.storeid > 0) {
      if (id === formatDate(ctx.selectedStore.sale_date)) {
        return "bg-orange-200";
      }
      return "bg-custom-white";
    }

    return "bg-custom-white";
  };

  return (
    <>
      <div className="bg-custom-white rounded-lg shadow-md px-2 py-0.5">
        <div className="flex justify-between font-medium">
          <div>Weekly Sales</div>
          <div>{displayName}</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
          <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
        </div>
        <div className="font-medium mb-2 mt-1">
          {pieChartData[pieChartData.length - 1][0].id} -{" "}
          {pieChartData[0][0].id}
        </div>
        <div className="grid grid-cols-[31.5%_68.5%]">
          <div className="text-[11px]">
            {[...ctx.salesViewWeekly].reverse().map((item, i) => (
              <div key={i} className="flex items-center">
                <div className="w-[30%]">{dow(item.id)}:</div>
                <div className="font-medium">{formatCurrency2(item.value)}</div>
              </div>
            ))}
          </div>
          <div className="h-full">
            <ResponsiveBar
              data={[...ctx.salesViewWeekly].reverse()}
              margin={{ top: 0, right: 0, bottom: 25, left: 0 }}
              enableLabel={false}
              colors={rgbaColor("#3b82f6", 0.3)}
              padding={0.1}
              borderRadius={4}
              borderWidth={2}
              axisLeft={{
                tickSize: 0,
                tickValues: 4,
              }}
              axisBottom={{
                renderTick: ({ x, y, textX, textY, value }) => {
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
                          fontWeight: "normal",
                          fontFamily: "Arial",
                        }}
                      >
                        <tspan x={0} dy={4}>
                          {formatId(value as string)}
                        </tspan>
                      </text>
                    </g>
                  );
                },
              }}
              borderColor={rgbaColor("#3b82f6", 1)}
            />
          </div>
        </div>
      </div>
      <div className="text-[11px]">
        <div className="h-full grid grid-cols-2 gap-2 mt-2">
          {[...pieChartData].map((pieData, i) => {
            return (
              <div
                key={i}
                className={`${activePieBg(pieData[0].id)} rounded-lg shadow-md p-1.5`}
              >
                <div className="flex justify-between mb-1.5 font-medium">
                  <div className="flex gap-1 items-center">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: colors[0] }}
                    ></div>
                    <div className="text-content/60">{pieData[0].id}</div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: colors[1] }}
                    ></div>
                    <div className="text-content/60">{pieData[1].id}</div>
                  </div>
                </div>
                {/* <div key={i} className="mb-2 rounded-lg shadow-md p-1.5"> */}
                <div className="h-[80px] relative">
                  <ResponsivePie
                    data={pieData}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    startAngle={-90}
                    endAngle={90}
                    innerRadius={0.51}
                    enableArcLabels={false}
                    enableArcLinkLabels={false}
                    colors={(param) => {
                      const data = param.data.value;
                      const found = pieData.indexOf(param.data);

                      // console.log(found);
                      const compare =
                        found === 0 ? pieData[1].value : pieData[0].value;
                      if (data < compare) return rgbaColor(colors[found], 0.3);

                      return colors[found];
                    }}
                  />
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 font-bold">
                    {dow(pieData[0].id)}
                  </div>
                </div>

                {/* Values with dates */}
                <div className="flex justify-between mt-1 text-center">
                  <div className="font-medium text-[11px]">
                    {/* <div className="flex gap-1 items-center">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: colors[0] }}
                      ></div>
                      <div>{pieData[0].id}</div>
                    </div> */}
                    <div>{formatCurrency2(pieData[0].value)}</div>
                  </div>
                  <div className="font-medium text-[11px]">
                    {/* <div className="flex gap-1 items-center">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: colors[1] }}
                      ></div>
                      <div>{pieData[1].id}</div>
                    </div> */}
                    <div>{formatCurrency2(pieData[1].value)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SalesViewWeekly;
