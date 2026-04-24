import { useEffect, useState } from "react";
import {
  formatBigNumber,
  formatCurrency2,
  sameWeekDayLastYear,
} from "../../../utils";
import type { HourlyTotal } from "../components";
import { useAppSelector } from "../../../hooks";

const HourlyGridTablet = () => {
  const [hour, setHour] = useState<number>(0);
  const [rowData, setRowData] = useState<HourlyTotal[]>([]);
  const [lyRowData, setLyRowData] = useState<HourlyTotal[]>([]);
  // const [selectedDay, setSelectedDay] = useState<string>("");
  // const [dates, setDates] = useState<string[]>([]);
  const [barData, setBarData] = useState<any[]>([]);
  const [_, setLyData] = useState<any[]>([]);
  const { hourlySales, selectedSalesPanel, hourlySalesLastYear } =
    useAppSelector((state) => state.sales);

  // useEffect(() => {
  //   if (barData.length) {
  //     const hourlyDates = barData.map((d) => d.full_date);
  //     const uniqueDates: string[] = Array.from(new Set(hourlyDates)).sort();
  //     setDates(uniqueDates);
  //   }
  // }, [barData]);

  useEffect(() => {
    const uniqueHours = hourlySales.reduce((acc: { hour: number }[], curr) => {
      if (!acc.find((h) => h.hour === curr.hour)) {
        acc.push({ hour: curr.hour });
      }
      return acc;
    }, []);

    setHour(uniqueHours[0]?.hour ?? 0);
  }, [hourlySales, selectedSalesPanel]);

  const formatDate = (dateStr: string, char: "-" | "/" = "-"): string => {
    const split = dateStr.split("T")[0].split(char);
    return `${split[1]}/${split[2]}`;
  };

  const formatDateFull = (dateStr: string, char: "-" | "/" = "-"): string => {
    const split = dateStr.split("T")[0].split(char);
    return `${split[1]}/${split[2]}/${split[0]}`;
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
        }
        return true;
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
        }
        return true;
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
  }, [hourlySales, hourlySalesLastYear, selectedSalesPanel.sale_date]);

  useEffect(() => {
    const hourFiltered = [...hourlySales]
      .filter((d) => {
        if (selectedSalesPanel.sale_date) {
          return (
            formatDate(d.sale_date) === formatDate(selectedSalesPanel.sale_date)
          );
        }
        return d.hour === hour;
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
        }
        return d.hour === hour;
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
  }, [hour, hourlySales, hourlySalesLastYear, selectedSalesPanel.sale_date]);

  const allHours = Array.from(
    new Set([...rowData.map((d) => d.hour), ...lyRowData.map((d) => d.hour)]),
  ).sort((a, b) => a - b);

  const dateRange = () => {
    // if (selectedDay.length) return formatDateFull(selectedDay);
    if (selectedSalesPanel.sale_date) {
      const lyDate = sameWeekDayLastYear(selectedSalesPanel.sale_date).date;
      // console.log(lyDate, selectedSalesPanel.sale_date);
      return `${formatDateFull(selectedSalesPanel.sale_date, "-")} vs ${formatDateFull(
        lyDate,
        "-",
      )}`;
    }

    const hourlyDates = barData.map((d) => d.full_date);
    const uniqueDates: string[] = Array.from(new Set(hourlyDates)).sort();

    if (uniqueDates.length === 0) return "";
    return `${formatDateFull(uniqueDates[0], "-")} - ${formatDateFull(
      uniqueDates[uniqueDates.length - 1],
      "-",
    )}`;
  };

  // const handleDaySelection = (date: string) => {
  //   if (selectedDay === date) {
  //     setSelectedDay("");
  //   } else {
  //     setSelectedDay(date);
  //   }
  // };

  return (
    <div className="bg-custom-white rounded-2xl shadow-lg ring-1 ring-slate-200/70 p-3 my-2">
      <div className="flex justify-between items-end mb-3">
        <div>
          <div className="font-semibold text-lg text-content">Hourly Sales</div>
          <div className="text-sm text-content/60">
            Hourly comparison for this year vs last year
          </div>
        </div>
        <div className="text-sm font-medium">{dateRange()}</div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="h-[2px] rounded-full bg-gradient-to-r from-blue-300 to-transparent" />
        <div className="h-[2px] rounded-full bg-gradient-to-l from-blue-300 to-transparent" />
      </div>

      {/* Testing this out */}
      {/* <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          All Dates
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dates.map((date) => (
            <span
              key={date}
              className={`inline-flex items-center rounded-full border border-blue-200 ${selectedDay === date ? "bg-blue-50 text-blue-700" : "bg-custom-white"} px-3 py-1 text-xs font-semibold shadow-sm`}
              onClick={() => handleDaySelection(date)}
            >
              {formatDateFull(date)}
            </span>
          ))}
        </div>
      </div> */}

      <div className="grid grid-cols-2 gap-2">
        {allHours.map((h) => {
          const current = rowData.find((r) => r.hour === h);
          const lastYear = lyRowData.find((r) => r.hour === h);

          const tySales = current?.total_sales ?? 0;
          const lySales = lastYear?.total_sales ?? 0;
          const tyTrans = current?.trans ?? 0;
          const lyTrans = lastYear?.trans ?? 0;

          const salesDiff = tySales - lySales;
          const salesPct = lySales !== 0 ? (salesDiff / lySales) * 100 : 0;

          // const transDiff = tyTrans - lyTrans;
          // const transPct = lyTrans !== 0 ? (transDiff / lyTrans) * 100 : 0;
          // const active = h === hour;

          return (
            <button
              key={`hour-${h}`}
              onClick={() => current && handleSelect(current)}
              className={`rounded-2xl p-3 text-left shadow-sm transition-all duration-200 border bg-bkg border-content/60`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-content">
                    Hour {h}
                  </div>
                </div>

                <div className="text-[12.5px] text-content/60">
                  <span
                    className={`font-semibold ${
                      salesDiff > 0
                        ? "text-emerald-500"
                        : salesDiff < 0
                          ? "text-red-500"
                          : "text-content"
                    }`}
                  >
                    {salesDiff > 0 ? "+" : ""}
                    {formatCurrency2(salesDiff)}{" "}
                    {lySales !== 0 ? `(${salesPct.toFixed(1)}%)` : ""}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white px-2.5 py-2 shadow-sm">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    TY Sales
                  </div>
                  <div className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
                    {formatCurrency2(tySales)}
                  </div>
                </div>

                <div className="rounded-xl bg-white px-2.5 py-2 shadow-sm">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    LY Sales
                  </div>
                  <div className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
                    {formatCurrency2(lySales)}
                  </div>
                </div>

                <div className="rounded-xl bg-white px-2.5 py-2 shadow-sm">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    TY Trans
                  </div>
                  <div className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
                    {formatBigNumber(tyTrans, 0)}
                  </div>
                </div>

                <div className="rounded-xl bg-white px-2.5 py-2 shadow-sm">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    LY Trans
                  </div>
                  <div className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
                    {formatBigNumber(lyTrans, 0)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyGridTablet;
