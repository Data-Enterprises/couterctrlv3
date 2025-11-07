import { ResponsiveLine } from "@nivo/line";
import { useAppSelector } from "../../../hooks";
import { useEffect, useState } from "react";
import { formatCurrency2 } from "../../../utils";

type LineData = { x: string; y: number; z: number }[];
type LineSeries = {
  id: number;
  data: LineData;
};

const WeeklyNetSales = () => {
  const sales = useAppSelector((state) => state.sales);
  const [lineData, setLineData] = useState<LineSeries[]>([]);

  const getDayMonth = (date: string) => {
    const newDate = date.split("-");
    return `${newDate[1]}/${newDate[2]}`;
  };

  useEffect(() => {
    if (sales.weeklySales) {
      const id = 1;
      const series: LineData = [...sales.weeklySales].map((day) => {
        const date = getDayMonth(day.sale_date.split("T")[0]);
        return {
          x: date,
          y: day.sales,
          z: day.qty,
        };
      });
      setLineData([
        {
          id,
          data: series,
        },
      ]);
    }
  }, [sales.weeklySales]);

  const getQty = (date: string) => {
    const found = sales.weeklySales?.find(
      (day) => getDayMonth(day.sale_date.split("T")[0]) === date
    );
    return found ? found.qty : 0;
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      <div className="font-medium mx-2 border-b border-content/30 py-0.5">
        Weekly Net Sales
      </div>
      <ResponsiveLine
        data={lineData}
        margin={{ top: 20, right: 30, bottom: 65, left: 80 }}
        curve="natural"
        pointSize={10}
        pointBorderWidth={2}
        pointBorderColor={{ from: "seriesColor" }}
        enableTouchCrosshair={true}
        useMesh={true}
        enableGridX={true}
        gridYValues={10}
        colors={["#3b82f6"]}
        animate={true}
        axisLeft={{
          tickValues: 10,
          format: (value) => `${formatCurrency2(value)}`,
        }}
        tooltip={({ point }) => (
          <div className="bg-custom-white p-2 rounded-lg shadow shadow-content text-sm">
            <div className="flex gap-1">
              <div>Date:</div>
              <div className="font-medium">{point.data.x}</div>
            </div>
            <div className="flex gap-1">
              <div>Sales:</div>
              <div className="font-medium">{formatCurrency2(point.data.y)}</div>
            </div>
            <div className="flex gap-1">
              <div>Qty:</div>
              <div className="font-medium">{getQty(point.data.x)}</div>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default WeeklyNetSales;
