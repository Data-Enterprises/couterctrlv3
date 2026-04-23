import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { type HourlyTotal } from "../components";
import { ResponsiveBar } from "@nivo/bar";
import {
  formatBigNumber,
  formatCurrency2,
  sameWeekDayLastYear,
} from "../../../utils";

const HourlyGrid = () => {
  const [hour, setHour] = useState<number>(0);
  const [rowData, setRowData] = useState<HourlyTotal[]>([]);
  const [lyRowData, setLyRowData] = useState<HourlyTotal[]>([]);
  const [barData, setBarData] = useState<any[]>([]);
  const [_, setLyData] = useState<any[]>([]);
  const { hourlySales, selectedSalesPanel, hourlySalesLastYear } =
    useAppSelector((state) => state.sales);
  const { isMobile } = useAppSelector((state) => state.app);
  const [barIndex, setBarIndex] = useState<string>("date");

  useEffect(() => {
    const uniqueHours = hourlySales.reduce((acc: { hour: number }[], curr) => {
      if (!acc.find((h) => h.hour === curr.hour)) {
        acc.push({ hour: curr.hour });
      }
      return acc;
    }, []);

    setHour(uniqueHours[0].hour);
    setBarIndex(selectedSalesPanel.sale_date ? "hour" : "date");
  }, [hourlySales, selectedSalesPanel]);

  const formatDate = (dateStr: string, char: "-" | "/" = "-"): string => {
    const split = dateStr.split("T")[0].split(char);
    return `${split[1]}/${split[2]}`;
  };

  const handleSelect = (param: HourlyTotal) => {
    setHour(Number(param.hour));
  };

  useEffect(() => {
    const totals = [...hourlySales]
      .filter((d) => {
        if (selectedSalesPanel.sale_date) {
          return (
            formatDate(d.sale_date) === formatDate(selectedSalesPanel.sale_date)
          );
        } else {
          return true;
        }
      })
      .reduce((acc: HourlyTotal[], curr) => {
        const exists = acc.find((d) => d.hour === curr.hour);
        if (exists) {
          exists.total_sales += curr.total_sales - curr.total_tax;
          exists.trans += curr.transactions;
        } else {
          acc.push({
            hour: curr.hour,
            total_sales: curr.total_sales - curr.total_tax,
            trans: curr.transactions,
          });
        }
        return acc;
      }, []);

    const lyTotals = [...hourlySalesLastYear]
      .filter((d) => {
        if (selectedSalesPanel.sale_date) {
          const lyDate = sameWeekDayLastYear(selectedSalesPanel.sale_date).date;
          return formatDate(d.sale_date) === formatDate(lyDate);
        } else {
          return true;
        }
      })
      .reduce((acc: HourlyTotal[], curr) => {
        const exists = acc.find((d) => d.hour === curr.hour);
        if (exists) {
          exists.total_sales += curr.total_sales - curr.total_tax;
          exists.trans += curr.transactions;
        } else {
          acc.push({
            hour: curr.hour,
            total_sales: curr.total_sales - curr.total_tax,
            trans: curr.transactions,
          });
        }
        return acc;
      }, []);

    setLyRowData(lyTotals);
    setRowData(totals);
  }, [hourlySales, hourlySalesLastYear]);

  useEffect(() => {
    const hourFiltered = [...hourlySales]
      .filter((d) => {
        if (selectedSalesPanel.sale_date) {
          return (
            formatDate(d.sale_date) === formatDate(selectedSalesPanel.sale_date)
          );
        } else {
          return d.hour === hour;
        }
      })
      .sort((a, b) => a.sale_date.localeCompare(b.sale_date))
      .map((d) => ({
        hour: d.hour,
        total_sales: d.total_sales - d.total_tax,
        date: formatDate(d.sale_date),
        full_date: d.sale_date,
      }));

    const lyFiltered = [...hourlySalesLastYear]
      .filter((d) => {
        if (selectedSalesPanel.sale_date) {
          const lyDate = sameWeekDayLastYear(selectedSalesPanel.sale_date).date;
          return formatDate(d.sale_date) === formatDate(lyDate);
        } else {
          return d.hour === hour;
        }
      })
      .sort((a, b) => a.sale_date.localeCompare(b.sale_date))
      .map((d) => ({
        hour: d.hour,
        total_sales: d.total_sales - d.total_tax,
        date: formatDate(d.sale_date),
        full_date: d.sale_date,
      }));

    setBarData(hourFiltered);
    setLyData(lyFiltered);
  }, [hour]);

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const compareCard = (val1: number, val2: number) => {
    if (!val2 || val1 === val2) return "text-content";

    if (val1 > val2) {
      return "bg-emerald-200";
    } else {
      return "bg-orange-200";
    }
  };

  const findBarColor = (value: number) => {
    const avgSales =
      barData.reduce((acc, val) => acc + val.total_sales, 0) / barData.length;

    if (value > avgSales) {
      return isMobile ? "bg-emerald-200" : "#10b981";
    } else {
      return isMobile ? "bg-orange-200" : "#f97316";
    }
  };

  // Merge all unique hours from both datasets
  const allHours = Array.from(
    new Set([...rowData.map((d) => d.hour), ...lyRowData.map((d) => d.hour)]),
  ).sort((a, b) => a - b);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg my-2 md:my-0 py-1.5">
      <div className="px-2 font-medium flex justify-between">
        <span className="font-medium text-sm md:text-[13.5px]">
          Hourly Sales
        </span>
        <span className="text-right text-sm md:text-[13.5px]">
          Hour: {hour}
        </span>
      </div>
      <div className="flex text-[13px] font-medium">
        <div className="grid grid-cols-2 md:flex md:w-[45%]">
          <div className="md:w-1/2 pl-2">This Year</div>
          <div className="md:w-1/2 pl-2">Last Year</div>
        </div>
        <div className="md:w-[55%] text-right pr-2">This Week</div>
      </div>
      <div className="h-[93%] grid gap-2 md:gap-0 md:grid-cols-[45%_54%] mt-1 md:mt-0">
        <div className="grid max-h-[200px] md:max-h-[230px] rounded-lg overflow-y-scroll mx-1 md:mx-2 no-scrollbar">
          <div className="md:grid-cols-2 md:col-span-1 gap-2">
            {allHours.map((h) => {
              const current = rowData.find((r) => r.hour === h);
              const lastYear = lyRowData.find((r) => r.hour === h);

              return (
                <div key={`hour-${h}`} className="grid grid-cols-2 gap-2 mb-1">
                  {/* This year */}
                  {current ? (
                    <div
                      className={`${h === hour ? "bg-blue-200" : compareCard(current.total_sales, lastYear ? lastYear.total_sales : 0)} 
                        text-xs rounded-lg shadow-md p-2 cursor-pointer hover:bg-blue-200 transition-all duration-200`}
                      onClick={() => handleSelect(current)}
                    >
                      <div className="flex justify-between font-medium">
                        <div className="text-content/60">Hour:</div>
                        <div>{current.hour}</div>
                      </div>
                      <div className="flex justify-between font-medium">
                        <div className="text-content/60">Sales:</div>
                        <div>{formatCurrency2(current.total_sales)}</div>
                      </div>
                      <div className="flex justify-between font-medium">
                        <div className="text-content/60">Trans:</div>
                        <div>{formatBigNumber(current.trans, 0)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-bkg text-xs rounded-lg shadow-md p-2 flex justify-center items-center font-medium text-content/60">
                      No Data Found
                    </div>
                  )}

                  {/* Last year */}
                  {lastYear ? (
                    <div
                      className={`${h === hour ? "bg-blue-200" : compareCard(lastYear.total_sales, current ? current.total_sales : 0)} 
                        text-xs rounded-lg shadow-md p-2 cursor-pointer hover:bg-blue-200 transition-all duration-200`}
                      onClick={() => handleSelect(lastYear)}
                    >
                      <div className="flex justify-between font-medium">
                        <div className="text-content/60">Hour:</div>
                        <div>{lastYear.hour}</div>
                      </div>
                      <div className="flex justify-between font-medium">
                        <div className="text-content/60">Sales:</div>
                        <div>{formatCurrency2(lastYear.total_sales)}</div>
                      </div>
                      <div className="flex justify-between font-medium">
                        <div className="text-content/60">Trans:</div>
                        <div>{formatBigNumber(lastYear.trans, 0)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-bkg text-xs rounded-lg shadow-md p-2 flex justify-center items-center font-medium text-content/60">
                      No Data Found
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          {!isMobile ? (
            <ResponsiveBar
              data={barData}
              margin={{
                top: 5,
                right: 0,
                bottom: selectedSalesPanel.sale_date ? 42 : 50,
                left: 45,
              }}
              keys={["total_sales"]}
              indexBy={barIndex}
              tooltip={({ value }) => (
                <div className="p-2 bg-white shadow-lg rounded text-sm text-nowrap">
                  <strong>{formatCurrency2(value)}</strong>
                </div>
              )}
              padding={0.1}
              enableLabel={false}
              borderRadius={4}
              borderWidth={2}
              colors={(d) => rgbaColor(findBarColor(d.data.total_sales), 0.3)}
              borderColor={(d) =>
                rgbaColor(findBarColor(d.data.data.total_sales), 1)
              }
              axisBottom={{
                renderTick: ({ x, y, textX, textY, value }) => {
                  // I set the full_date property on barData so I can process the DOW here
                  let fullDate = "";
                  let dow = "";

                  if (typeof value === "string") {
                    const found = barData.find((d) => d.date === value);
                    if (found) {
                      fullDate = found.full_date;
                      dow = new Date(fullDate).toDateString().split(" ")[0];
                    }
                  }
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
                          {value}
                        </tspan>
                      </text>
                    </g>
                  );
                },
              }}
            />
          ) : // <div className="grid gap-2 min-h[200px] max-h-[200px] overflow-y-scroll no-scrollbar mr-1">
          //   {barData
          //     .filter((h) => h.hour === hour)
          //     .map((h) => (
          //       <div
          //         key={`display-date-${h.hour}-${Math.random()}`}
          //         style={{ backgroundColor: findBarColor(h.total_sales) }}
          //         className={`${findBarColor(h.total_sales)} text-xs rounded-lg shadow-content/30 shadow-md p-2 cursor-pointer hover:bg-blue-200 transition-all duration-200`}
          //       >
          //         <div className="flex justify-between">
          //           <div className="font-medium text-content/60">Date:</div>
          //           <div className="font-medium">{h.date}</div>
          //         </div>
          //         <div className="flex justify-between">
          //           <div className="font-medium text-content/60">Hour:</div>
          //           <div className="font-medium">{h.hour}</div>
          //         </div>
          //         <div className="flex justify-between">
          //           <div className="font-medium text-content/60">Sales:</div>
          //           <div className="font-medium">
          //             {formatCurrency2(h.total_sales)}
          //           </div>
          //         </div>
          //       </div>
          //     ))}
          // </div>
          null}
        </div>
      </div>
    </div>
  );
};

export default HourlyGrid;
