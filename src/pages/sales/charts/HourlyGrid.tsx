import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { type HourlyTotal } from "../graphs";
import { ResponsiveBar } from "@nivo/bar";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

const HourlyGrid = () => {
  const [hour, setHour] = useState<number>(0);
  const [rowData, setRowData] = useState<HourlyTotal[]>([]);
  const [barData, setBarData] = useState<any[]>([]);
  const { hourlySales, selectedSalesPanel } = useAppSelector(
    (state) => state.sales,
  );
  const { isMobile } = useAppSelector((state) => state.app);
  const [barIndex, setBarIndex] = useState<string>("date");

  useEffect(() => {
    if (!hourlySales.length) return;
    const uniqueHours = hourlySales.reduce((acc: { hour: number }[], curr) => {
      if (!acc.find((h) => h.hour === curr.hour)) {
        acc.push({ hour: curr.hour });
      }
      return acc;
    }, []);

    setHour(uniqueHours[0].hour);
    setBarIndex(selectedSalesPanel.sale_date ? "hour" : "date");
  }, [hourlySales, selectedSalesPanel]);

  const formatDate = (dateStr: string): string => {
    const split = dateStr.split("T")[0].split("-");
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

    setRowData(totals);
  }, [hourlySales]);

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
      }));

    setBarData(hourFiltered);
  }, [hour]);

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const handleAvg = (panel: {
    hour: number;
    total_sales: number;
    trans: number;
  }) => {
    const avgSales =
      rowData.reduce((acc, val) => acc + val.total_sales, 0) / rowData.length;
    if (panel.total_sales > avgSales) {
      return "bg-emerald-200";
    } else if (panel.total_sales < avgSales) {
      return "bg-orange-200";
    } else {
      return "";
    }
  };

  const findBarColor = (value: number) => {
    const avgSales =
      barData.reduce((acc, val) => acc + val.total_sales, 0) / barData.length;

    if (value > avgSales) {
      return isMobile ? "bg-emerald-200" : "#10b981";
    } else if (value < avgSales) {
      return isMobile ? "bg-orange-200" : "#f97316";
    } else {
      return isMobile ? "bg-[#bfdbfe]" : "#bfdbfe";
    }
  };

  const contextMargins = () => {
    return !isMobile
      ? { top: 10, right: 0, bottom: 25, left: 50 }
      : { top: 10, right: 0, bottom: 25, left: 29 };
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg my-2 md:my-0 py-2">
      <div className="px-2 font-medium grid grid-cols-[25%_50%_25%]">
        <span className="font-medium text-sm md:text-[16px]">Hourly Sales</span>
        <div className="flex gap-2 md:gap-4 text-sm justify-center">
          <div className="flex gap-1 items-center">
            <div className="rounded-full h-3 w-3 bg-orange-500"></div>
            <div className="text-xs md:text-sm">Below Avg</div>
          </div>
          <div className="flex gap-1 items-center">
            <div className="rounded-full h-3 w-3 bg-emerald-500"></div>
            <div className="text-xs md:text-sm">Above Avg</div>
          </div>
        </div>
        <span className="text-right text-sm md:text-[16px]">Hour: {hour}</span>
      </div>
      <div className="h-[93%] grid grid-cols-2 gap-2 md:gap-0 md:grid-cols-[40%_59%] mt-1 md:mt-0">
        <div className="grid md:grid-cols-2 gap-2 max-h-[200px] md:max-h-[290px] rounded-lg overflow-y-scroll mx-1 md:mx-2 no-scrollbar">
          {rowData.map((r) => (
            <div
              key={`hour-${r.hour}`}
              className={`${r.hour === hour ? "bg-blue-200" : handleAvg(r)} text-xs rounded-lg shadow-content/30 shadow-md p-2 cursor-pointer hover:bg-blue-200 transition-all duration-200`}
              onClick={() => handleSelect(r)}
            >
              <div className="flex justify-between">
                <div className="font-medium text-content/60">Hour:</div>
                <div className="font-medium">{r.hour}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-medium text-content/60">Sales:</div>
                <div className="font-medium">
                  {formatCurrency2(r.total_sales)}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="font-medium text-content/60">Trans:</div>
                <div className="font-medium">{formatBigNumber(r.trans, 0)}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          {!isMobile ? (
            <ResponsiveBar
              data={barData}
              margin={contextMargins()}
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
            />
          ) : (
            <div className="grid gap-2 min-h[200px] max-h-[200px] overflow-y-scroll no-scrollbar mr-1">
              {barData
                .filter((h) => h.hour === hour)
                .map((h) => (
                  <div
                    key={`date-${h.hour}`}
                    className={`${findBarColor(h.total_sales)} text-xs rounded-lg shadow-content/30 shadow-md p-2 cursor-pointer hover:bg-blue-200 transition-all duration-200`}
                  >
                    <div className="flex justify-between">
                      <div className="font-medium text-content/60">Date:</div>
                      <div className="font-medium">{h.date}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="font-medium text-content/60">Hour:</div>
                      <div className="font-medium">{h.hour}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="font-medium text-content/60">Sales:</div>
                      <div className="font-medium">
                        {formatCurrency2(h.total_sales)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HourlyGrid;
