import { useSubMarginCtx } from "../hooks";
import type { SubDeptMargin } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { type WeekBarData, formatDate } from "../display/allWeeks";
import { calculateCogs } from "..";
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

const WeekOverviewTablet = ({ dates, data, week }: WeekOverviewProps) => {
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
          <div className="text-emerald-500 flex items-center gap-1">
            <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />
            {formatCurrency2(Math.abs(thisWeekSales - avgOtherWeeksSales))}
          </div>
        ) : thisWeekSales < avgOtherWeeksSales ? (
          <div className="text-orange-500 flex items-center gap-1">
            <ArrowTrendingDownIcon className="h-5 w-5 text-orange-500" />
            {formatCurrency2(Math.abs(thisWeekSales - avgOtherWeeksSales))}
          </div>
        ) : (
          <div className="text-content flex items-center gap-1">
            <ArrowRightIcon className="h-5 w-5 text-content" />
            {formatCurrency2(Math.abs(thisWeekSales - avgOtherWeeksSales))}
          </div>
        ),
      marginTrend:
        thisWeekMargin > avgOtherWeeksMargin ? (
          <div className="text-emerald-500 flex items-center gap-1">
            <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />
            {Math.abs(thisWeekMargin - avgOtherWeeksMargin).toFixed(2)}%
          </div>
        ) : thisWeekMargin < avgOtherWeeksMargin ? (
          <div className="text-orange-500 flex items-center gap-1">
            <ArrowTrendingDownIcon className="h-5 w-5 text-orange-500" />
            {Math.abs(thisWeekMargin - avgOtherWeeksMargin).toFixed(2)}%
          </div>
        ) : (
          <div className="text-content flex items-center gap-1">
            <ArrowRightIcon className="h-5 w-5 text-content" />
            {Math.abs(thisWeekMargin - avgOtherWeeksMargin).toFixed(2)}%
          </div>
        ),
    };
  };

  return (
    <div className="bg-custom-white rounded-xl shadow-md text-sm select-none overflow-hidden">
      <div className="font-medium px-3 py-2 flex items-center justify-between rounded-t-xl text-[13px] md:text-sm tracking-wide">
        <div className="text-content/80">Week {week}</div>
        <div className="text-content/55">{dates}</div>
      </div>

      <div className="grid grid-cols-2 h-px">
        <div className="bg-gradient-to-r from-[rgb(30,45,80)]/80 to-custom-white"></div>
        <div className="bg-gradient-to-l from-[rgb(30,45,80)]/80 to-custom-white"></div>
      </div>

      <div className="p-3 text-[13px] grid grid-cols-[58%_41%] gap-3">
        {/* Trend (top) and Daily Sales (bottom) */}
        <div className="grid gap-3">
          {week < 4 ? (
            <div className="uppercase">
              {week === 1 ? (
                <div className="grid grid-cols-2 gap-3 text-[12px] text-content/70">
                  <div className="bg-bkg/70 rounded-md shadow flex flex-col justify-center items-center py-1.5">
                    GPM Overall {overallTrends().marginTrend}
                  </div>
                  <div className="bg-bkg/70 rounded-md shadow flex flex-col justify-center items-center py-1.5">
                    Sales Overall {overallTrends().salesTrend}
                  </div>
                  <div className="bg-bkg/70 rounded-md shadow flex flex-col justify-center items-center py-1.5">
                    GPM Weekly {marginTrend()}
                  </div>
                  <div className="bg-bkg/70 rounded-md shadow flex flex-col justify-center items-center py-1.5">
                    Sales Weekly {salesTrend()}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 h-full">
                  <div className="bg-bkg/70 w-full text-content/60 font-medium flex flex-col items-center justify-center rounded-md shadow py-1.5">
                    <div className="text-[12px] mb-1">Weekly Margin Trend</div>
                    <div className="text-sm">{marginTrend()}</div>
                  </div>
                  <div className="bg-bkg/70 w-full text-content/60 font-medium flex flex-col items-center justify-center rounded-md shadow py-1.5">
                    <div className="text-[12px] mb-1">Weekly Sales Trend</div>
                    <div className="text-sm">{salesTrend()}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-bkg/70 rounded-xl shadow-sm p-3 flex justify-center items-center min-h-20">
              <div className="text-content/60 font-medium tracking-wide text-[13px]">
                Base Line Trend
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 py-1">
            {barData.map((d, i) => (
              <div
                key={i}
                className="bg-bkg/75 py-2 rounded-lg shadow-sm text-center flex flex-col items-center justify-between"
              >
                <div className="text-[12px] text-content/75 tracking-wide">
                  {d.date}
                </div>
                <div className="font-medium text-[13px]">
                  {formatCurrency2(d.sales)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals => margin, profit, sales, qty, cost, tax, weight, unique items */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center py-1.5">
            <div className="text-content/55 text-[12px] tracking-wide uppercase">
              Margin
            </div>
            <div className="text-[13px] font-medium">{margin.toFixed(2)}%</div>
          </div>

          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center py-1.5">
            <div className="text-content/55 text-[12px] tracking-wide uppercase">
              Profit
            </div>
            <div className="text-[13px] font-medium">
              {formatCurrency2(sales - cost)}
            </div>
          </div>

          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center py-1.5">
            <div className="text-content/55 text-[12px] tracking-wide uppercase">
              Sales
            </div>
            <div className="text-[13px] font-medium">
              {formatCurrency2(sales)}
            </div>
          </div>

          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center py-1.5">
            <div className="text-content/55 text-[12px] tracking-wide uppercase">
              Qty
            </div>
            <div className="text-[13px] font-medium">
              {formatBigNumber(qty, 0)}
            </div>
          </div>

          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center py-1.5">
            <div className="text-content/55 text-[12px] tracking-wide uppercase">
              Cost
            </div>
            <div className="text-[13px] font-medium">
              {formatCurrency2(cost)}
            </div>
          </div>

          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center py-1.5">
            <div className="text-content/55 text-[12px] tracking-wide uppercase">
              Tax
            </div>
            <div className="text-[13px] font-medium">
              {formatCurrency2(tax)}
            </div>
          </div>

          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center py-1.5">
            <div className="text-content/55 text-[12px] tracking-wide uppercase">
              Weight
            </div>
            <div className="text-[13px] font-medium">
              {formatBigNumber(weight)} lbs
            </div>
          </div>

          <div className="bg-bkg/70 rounded-lg shadow flex flex-col items-center justify-center py-1.5">
            <div className="text-content/55 text-[12px] tracking-wide uppercase">
              Unique Items
            </div>
            <div className="text-[13px] font-medium">{uniqueItems}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekOverviewTablet;
