import { formatBigNumber, formatCurrency2 } from "../../../../utils";
import { useMobileSalesCtx } from "../hooks";

interface SalesViewHourlyProps {
  displayName: string;
}

const SalesViewHourly = ({ displayName }: SalesViewHourlyProps) => {
  const ctx = useMobileSalesCtx();
  // need to map through ctx.hours =>then find the hour in salesViewHourly and salesViewHourlyLastYear, and display those values in a row format
  // if not foud, then we put 0 for that value

  const tyDate = ctx.salesViewHourly[0].sale_date;
  const lyDate = ctx.salesViewHourlyLastYear.length
    ? ctx.salesViewHourlyLastYear[0].sale_date
    : "";

  const tyDates = [...ctx.hourlySales].reduce((acc: any[], curr) => {
    const found = acc.find((a) => a.hour === curr.hour);

    if (found) {
      found.total_sales += curr.total_sales - curr.total_tax;
      found.transactions += curr.transactions;
      found.qty += curr.qty;
    } else {
      acc.push({
        sale_date: curr.sale_date,
        hour: curr.hour,
        total_sales: curr.total_sales - curr.total_tax,
        transactions: curr.transactions,
        qty: curr.qty,
      });
    }

    return acc;
  }, []);

  const lyDates = [...ctx.hourlySalesLastYear].reduce((acc: any[], curr) => {
    const found = acc.find((a) => a.hour === curr.hour);

    if (found) {
      found.total_sales += curr.total_sales;
      found.transactions += curr.transactions;
      found.qty += curr.qty;
    } else {
      acc.push({
        sale_date: curr.sale_date,
        hour: curr.hour,
        total_sales: curr.total_sales,
        transactions: curr.transactions,
        qty: curr.qty,
      });
    }

    return acc;
  }, []);

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  const bgColor = (val1: number, val2: number) => {
    if (val1 === 0 || val2 === 0) return "bg-bkg";
    if (val1 > val2) return "bg-emerald-200";
    if (val1 < val2) return "bg-orange-200";
    return "bg-bkg";
  };

  const formatDateDisplay = (date: "ty" | "ly") => {
    if (ctx.dashboardOption === "daily") {
      return date === "ty" ? formatDate(tyDate) : formatDate(ctx.weeklySalesLastYear[0].sale_date);
    }
    if (date === "ty") {
      return `${formatDate(ctx.weeklySales[ctx.weeklySales.length - 1].sale_date)} - ${formatDate(ctx.weeklySales[0].sale_date)}`;
    } else {
      return `${formatDate(ctx.weeklySalesLastYear[ctx.weeklySalesLastYear.length - 1].sale_date)} - ${formatDate(ctx.weeklySalesLastYear[0].sale_date)}`;
    }
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-md py-2 text-[11px]">
      <div className="flex justify-between font-medium px-2">
        <div>Hourly Sales</div>
        <div>{displayName}</div>
      </div>
      <div className="grid grid-cols-2 mb-1 px-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>

      {/* The grid that will render based on a selected store row or overview for all */}
      {ctx.hourlyKey === "sale_date" ? (
        <div>
          <div className="px-2 font-medium grid grid-cols-2 gap-2">
            <div>
              {formatDateDisplay('ty')}
            </div>
            <div>
              {formatDateDisplay('ly')}
            </div>
          </div>

          <div className="text-[12px] space-y-1.5 max-h-[275px] overflow-y-auto">
            {ctx.hours.map((h, i) => {
              const tyData = tyDates.find((s) => s.hour === h);
              const lyData = lyDates.find((s) => s.hour === h);

              return (
                <div key={i} className="grid grid-cols-2 gap-2 px-2">
                  {/* This year */}
                  {tyData ? (
                    <div
                      className={`rounded-lg shadow-md p-1.5 ${bgColor(tyData.total_sales, lyData?.total_sales || 0)}`}
                    >
                      <div className="font-medium flex justify-between">
                        <div>Hour:</div>
                        <div>{h}</div>
                      </div>
                      <div className="font-medium flex justify-between">
                        <div>Sales:</div>
                        <div>{formatCurrency2(tyData.total_sales)}</div>
                      </div>
                      <div className="font-medium flex justify-between">
                        <div>Trans:</div>
                        <div>{formatBigNumber(tyData.transactions, 0)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[66px] rounded-lg shadow-md p-1.5 flex justify-center items-center font-medium text-content/60 bg-bkg">
                      No Data
                    </div>
                  )}

                  {/* Last year */}
                  {lyData ? (
                    <div
                      className={`rounded-lg shadow-md p-1.5 ${bgColor(lyData.total_sales, tyData?.total_sales || 0)}`}
                    >
                      <div className="font-medium flex justify-between">
                        <div>Hour:</div>
                        <div>{h}</div>
                      </div>
                      <div className="font-medium flex justify-between">
                        <div>Sales:</div>
                        <div>{formatCurrency2(lyData.total_sales)}</div>
                      </div>
                      <div className="font-medium flex justify-between">
                        <div>Trans:</div>
                        <div>{formatBigNumber(lyData.transactions, 0)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[66px] rounded-lg shadow-md p-1.5 flex justify-center items-center font-medium text-content/60 bg-bkg">
                      No Data
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="">
          <div className="px-2 font-medium grid grid-cols-2 gap-2">
            <div>{formatDate(tyDate)}</div>
            <div>{formatDate(lyDate)}</div>
          </div>

          <div className="text-[12px] space-y-1.5 max-h-[275px] overflow-y-auto">
            {ctx.hours.map((h, i) => {
              const tyData = ctx.salesViewHourly.find((s) => s.hour === h);
              const lyData = ctx.salesViewHourlyLastYear.find(
                (s) => s.hour === h,
              );

              return (
                <div key={i} className="grid grid-cols-2 gap-2 px-2">
                  {/* This year */}
                  {tyData ? (
                    <div
                      className={`rounded-lg shadow-md p-1.5 ${bgColor(tyData.total_sales, lyData?.total_sales || 0)}`}
                    >
                      <div className="font-medium flex justify-between">
                        <div>Hour:</div>
                        <div>{h}</div>
                      </div>
                      <div className="font-medium flex justify-between">
                        <div>Sales:</div>
                        <div>
                          {formatCurrency2(
                            tyData.total_sales - tyData.total_tax,
                          )}
                        </div>
                      </div>
                      <div className="font-medium flex justify-between">
                        <div>Trans:</div>
                        <div>{formatBigNumber(tyData.transactions, 0)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[66px] rounded-lg shadow-md p-1.5 flex justify-center items-center font-medium text-content/60 bg-bkg">
                      No Data
                    </div>
                  )}
                  {/* Last year */}
                  {lyData ? (
                    <div
                      className={`rounded-lg shadow-md p-1.5 ${bgColor(lyData.total_sales, tyData?.total_sales || 0)}`}
                    >
                      <div className="font-medium flex justify-between">
                        <div>Hour:</div>
                        <div>{h}</div>
                      </div>
                      <div className="font-medium flex justify-between">
                        <div>Sales:</div>
                        <div>
                          {formatCurrency2(
                            lyData.total_sales - lyData.total_tax,
                          )}
                        </div>
                      </div>
                      <div className="font-medium flex justify-between">
                        <div>Trans:</div>
                        <div>{formatBigNumber(lyData.transactions, 0)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[66px] rounded-lg shadow-md p-1.5 flex justify-center items-center font-medium text-content/60 bg-bkg">
                      No Data
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesViewHourly;
