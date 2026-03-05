import type { SubDeptMargin } from "../../../../interfaces";
import { ResponsiveBar, type BarDatum } from "@nivo/bar";
import { formatBigNumber, formatCurrency2 } from "../../../../utils";
import { type WeekBarData, formatDate } from ".";
import { calculateCogs } from "../..";

interface WeekOverviewProps {
  dates: string;
  data: SubDeptMargin[];
}

const WeekOverview = ({ dates, data }: WeekOverviewProps) => {
  const barData = data.reduce<WeekBarData[]>((acc, curr) => {
    // sales: item.sales,
    // date: item.date,
    const formatted = formatDate(curr.sale_date.split("T")[0]);
    const existing = acc.find((item) => item.date === formatted);
    if (existing) {
      existing.sales += curr.total_sales - curr.total_tax;
    } else {
      acc.push({
        sales: curr.total_sales - curr.total_tax,
        date: formatted,
      });
    }
    return acc;
  }, []);
  const max = Math.max(...barData.map((data) => data.sales));
  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const sales = data.reduce(
    (acc, curr) => acc + curr.total_sales - curr.total_tax,
    0,
  );
  const cost = data.reduce(
    (acc, curr) =>
      acc + calculateCogs(curr.net_cost, curr.case_size, curr.qty),
    0,
  );
  const qty = data.reduce((acc, curr) => acc + curr.qty, 0);
  const tax = data.reduce((acc, curr) => acc + curr.total_tax, 0);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg text-sm select-none">
      <div className="bg-blue-500 text-custom-white font-medium px-2 py-0.5 flex items-center justify-between rounded-t-lg">
        <div>Week Overview</div>
        <div>{dates}</div>
      </div>

      {/* Card Body */}
      <div className="p-2 h-[95%]">
        <div className="h-2/3 flex gap-2">
          <div className="h-full w-[60%] bg-bkg/70 rounded-lg shadow-md relative">
            <div className="font-medium absolute w-full text-center underline">
              Total Sales
            </div>
            <ResponsiveBar
              data={barData as unknown as BarDatum[]}
              margin={{
                top: 30,
                right: 15,
                bottom: 30,
                left: max > 9999 ? 65 : 50,
              }}
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
                    text: {
                      fontSize: 11,
                      strokeWidth: 2,
                      fontWeight: "bolder",
                    },
                  },
                },
                format: (value) =>
                  formatCurrency2(value as number).split(".")[0],
              }}
              axisBottom={{
                style: {
                  domain: {
                    line: { stroke: "#3b82f6", strokeWidth: 1.5 },
                  },
                  ticks: {
                    text: {
                      fontSize: 11,
                      strokeWidth: 2,
                      fontWeight: "bolder",
                    },
                  },
                },
                format: (value) => value.split("/").slice(0, 2).join("/"),
              }}
              enableLabel={false}
              enableGridX={false}
            />
          </div>
          <div className="h-full w-[40%] bg-bkg/70 rounded-lg shadow-md p-2 grid gap-2">
            <div className="bg-red-200"></div>
            <div className="bg-red-200"></div>
          </div>
        </div>
        <div className="mt-2 h-[28%] grid grid-cols-4 gap-2 font-medium">
          <div className="rounded-lg shadow flex flex-col items-center justify-center">
            <div className="text-content/50">Sales</div>
            <div>{formatCurrency2(sales)}</div>
          </div>
          <div className="rounded-lg shadow flex flex-col items-center justify-center">
            <div className="text-content/50">Cost</div>
            <div>{formatCurrency2(cost)}</div>
          </div>
          <div className="rounded-lg shadow flex flex-col items-center justify-center">
            <div className="text-content/50">Qty</div>
            <div>{formatBigNumber(qty, 0)}</div>
          </div>
          <div className="rounded-lg shadow flex flex-col items-center justify-center">
            <div className="text-content/50">Tax</div>
            <div>{formatCurrency2(tax)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekOverview;
