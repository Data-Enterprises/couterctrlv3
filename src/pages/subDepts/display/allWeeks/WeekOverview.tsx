import { useSubMarginCtx } from "../../hooks";
import type { SubDeptMargin } from "../../../../interfaces";
import { ResponsiveBar, type BarDatum } from "@nivo/bar";
import { formatBigNumber, formatCurrency2 } from "../../../../utils";
import { type WeekBarData, formatDate } from ".";
import { calculateCogs } from "../..";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface WeekOverviewProps {
  week: number;
  dates: string;
  data: SubDeptMargin[];
}

const WeekOverview = ({ dates, data, week }: WeekOverviewProps) => {
  const ctx = useSubMarginCtx();

  const barData = data.reduce<WeekBarData[]>((acc, curr) => {
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
      acc +
      calculateCogs(
        curr.net_cost,
        curr.cost,
        curr.case_size,
        curr.qty,
        curr.weight,
      ),
    0,
  );
  const qty = data.reduce((acc, curr) => acc + curr.qty, 0);
  const tax = data.reduce((acc, curr) => acc + curr.total_tax, 0);

  const margin = ((sales - cost) / sales) * 100;
  const uniqueItems = new Set(data.map((item) => item.product_code)).size;
  const weight = data.reduce((acc, curr) => acc + curr.weight, 0);

  const getSalesAndCogs = (data: SubDeptMargin[]) => {
    return data.reduce(
      (acc, curr) => {
        const sales = curr.total_sales - curr.total_tax;
        const cost = calculateCogs(
          curr.net_cost,
          curr.cost,
          curr.case_size,
          curr.qty,
          curr.weight,
        );
        acc.sales += sales;
        acc.cogs += cost;
        return acc;
      },
      { sales: 0, cogs: 0 },
    );
  };

  const marginTrend = () => {
    const thisWeekMargin = margin;
    let lastWeekMargin = 0;

    if (week === 1) {
      const salesAndCogs = getSalesAndCogs(ctx.weekTwoMargins);
      lastWeekMargin =
        ((salesAndCogs.sales - salesAndCogs.cogs) / salesAndCogs.sales) * 100;
    } else if (week === 2) {
      const salesAndCogs = getSalesAndCogs(ctx.weekThreeMargins);
      lastWeekMargin =
        ((salesAndCogs.sales - salesAndCogs.cogs) / salesAndCogs.sales) * 100;
    } else if (week === 3) {
      const salesAndCogs = getSalesAndCogs(ctx.weekFourMargins);
      lastWeekMargin =
        ((salesAndCogs.sales - salesAndCogs.cogs) / salesAndCogs.sales) * 100;
    }

    if (thisWeekMargin > lastWeekMargin) {
      return (
        <div className="text-emerald-500 flex items-center gap-1">
          <ArrowTrendingUpIcon className="h-5 w-5" />
          {Math.abs(thisWeekMargin - lastWeekMargin).toFixed(2)}%
        </div>
      );
    } else if (thisWeekMargin < lastWeekMargin) {
      return (
        <div className="text-orange-500 flex items-center gap-1">
          <ArrowTrendingDownIcon className="h-5 w-5" />
          {Math.abs(thisWeekMargin - lastWeekMargin).toFixed(2)}%
        </div>
      );
    } else {
      return (
        <div className="text-content flex items-center gap-1">
          <ArrowRightIcon className="h-5 w-5" />
          {Math.abs(thisWeekMargin - lastWeekMargin).toFixed(2)}%
        </div>
      );
    }
  };

  const salesTrend = () => {
    const thisWeekSales = sales;
    let lastWeekSales = 0;

    if (week === 1) {
      lastWeekSales = ctx.weekTwoMargins.reduce(
        (acc, curr) => acc + curr.total_sales - curr.total_tax,
        0,
      );
    } else if (week === 2) {
      lastWeekSales = ctx.weekThreeMargins.reduce(
        (acc, curr) => acc + curr.total_sales - curr.total_tax,
        0,
      );
    } else if (week === 3) {
      lastWeekSales = ctx.weekFourMargins.reduce(
        (acc, curr) => acc + curr.total_sales - curr.total_tax,
        0,
      );
    }

    if (thisWeekSales > lastWeekSales) {
      return (
        <div className="text-emerald-500 flex items-center gap-1">
          <ArrowTrendingUpIcon className="h-5 w-5" />
          {formatCurrency2(Math.abs(thisWeekSales - lastWeekSales))}
        </div>
      );
    } else if (thisWeekSales < lastWeekSales) {
      return (
        <div className="text-orange-500 flex items-center gap-1">
          <ArrowTrendingDownIcon className="h-5 w-5" />
          {formatCurrency2(Math.abs(thisWeekSales - lastWeekSales))}
        </div>
      );
    } else {
      return (
        <div className="text-content flex items-center gap-1">
          <ArrowRightIcon className="h-5 w-5" />
          {formatCurrency2(Math.abs(thisWeekSales - lastWeekSales))}
        </div>
      );
    }
  };

  const overallTrends = () => {
    const thisWeekSales = sales;
    const thisWeekMargin = margin;

    // For the sales and margin trends compared to the average of the other 3 weeks
    const week2Sales = ctx.weekTwoMargins.reduce(
      (acc, curr) => acc + curr.total_sales - curr.total_tax,
      0,
    );
    const week3Sales = ctx.weekThreeMargins.reduce(
      (acc, curr) => acc + curr.total_sales - curr.total_tax,
      0,
    );
    const week4Sales = ctx.weekFourMargins.reduce(
      (acc, curr) => acc + curr.total_sales - curr.total_tax,
      0,
    );

    // used to calculate the margins for the previous three weeks
    const week2Cost = ctx.weekTwoMargins.reduce(
      (acc, curr) =>
        acc +
        calculateCogs(
          curr.net_cost,
          curr.cost,
          curr.case_size,
          curr.qty,
          curr.weight,
        ),
      0,
    );
    const week3Cost = ctx.weekThreeMargins.reduce(
      (acc, curr) =>
        acc +
        calculateCogs(
          curr.net_cost,
          curr.cost,
          curr.case_size,
          curr.qty,
          curr.weight,
        ),
      0,
    );
    const week4Cost = ctx.weekFourMargins.reduce(
      (acc, curr) =>
        acc +
        calculateCogs(
          curr.net_cost,
          curr.cost,
          curr.case_size,
          curr.qty,
          curr.weight,
        ),
      0,
    );

    // the previous 3 week margins
    const week2Margin = ((week2Sales - week2Cost) / week2Sales) * 100;
    const week3Margin = ((week3Sales - week3Cost) / week3Sales) * 100;
    const week4Margin = ((week4Sales - week4Cost) / week4Sales) * 100;

    // the average of the other 3 weeks for sales and margin => to be returned for week 1 only => shows the overall trends
    const avgOtherWeeksSales = (week2Sales + week3Sales + week4Sales) / 3;
    const avgOtherWeeksMargin = (week2Margin + week3Margin + week4Margin) / 3;

    return {
      salesTrend:
        thisWeekSales > avgOtherWeeksSales ? (
          <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />
        ) : thisWeekSales < avgOtherWeeksSales ? (
          <ArrowTrendingDownIcon className="h-5 w-5 text-orange-500" />
        ) : (
          <ArrowRightIcon className="h-5 w-5 text-content" />
        ),
      marginTrend:
        thisWeekMargin > avgOtherWeeksMargin ? (
          <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />
        ) : thisWeekMargin < avgOtherWeeksMargin ? (
          <ArrowTrendingDownIcon className="h-5 w-5 text-orange-500" />
        ) : (
          <ArrowRightIcon className="h-5 w-5 text-content" />
        ),
    };
  };

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
          <div className="h-full w-[40%] grid grid-rows-2 gap-2">
            {week < 4 ? (
              <div className="bg-bkg/70 rounded-lg shadow-md p-2 flex flex-col justify-around">
                {week === 1 ? (
                  <div className="text-content/50 font-medium flex justify-between items-center mb-1">
                    <div>Overall</div>
                    <div className="flex gap-1 items-center">
                      Sales {overallTrends().salesTrend}
                    </div>
                    <div className="flex gap-1 items-center">
                      Margin {overallTrends().salesTrend}
                    </div>
                  </div>
                ) : null}
                <div className="text-content/50 font-medium text-lg flex justify-between items-center">
                  <div>Margin Trend</div>
                  {marginTrend()}
                </div>
                <div className="text-content/50 font-medium text-lg flex justify-between items-center">
                  <div> Sales Trend</div>
                  {salesTrend()}
                </div>
              </div>
            ) : (
              <div className="bg-bkg/70 rounded-lg shadow-md p-2 flex justify-center items-ceter">
                <div className="text-content/50 font-medium text-lg flex justify-between items-center">
                  Base Line Trend
                </div>
              </div>
            )}
            <div className="bg-bkg/70 rounded-lg shadow-md p-2 grid">
              <div className="font-medium flex justify-between">
                <div className="text-content/60">Margin</div>
                <div>{margin.toFixed(2)}%</div>
              </div>
              <div className="font-medium flex justify-between">
                <div className="text-content/60">Profit</div>
                <div>{formatCurrency2(sales - cost)}</div>
              </div>
              <div className="font-medium flex justify-between">
                <div className="text-content/60">Unique Items</div>
                <div>{uniqueItems}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 h-[28%] grid grid-cols-5 gap-2 font-medium">
          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center">
            <div className="text-content/50">Sales</div>
            <div>{formatCurrency2(sales)}</div>
          </div>
          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center">
            <div className="text-content/50">Cost</div>
            <div>{formatCurrency2(cost)}</div>
          </div>
          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center">
            <div className="text-content/50">Qty</div>
            <div>{formatBigNumber(qty, 0)}</div>
          </div>
          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center">
            <div className="text-content/50">Weight</div>
            <div>{formatBigNumber(weight)}</div>
          </div>
          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center">
            <div className="text-content/50">Tax</div>
            <div>{formatCurrency2(tax)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekOverview;
