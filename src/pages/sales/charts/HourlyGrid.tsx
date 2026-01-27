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
  // const [barColor, setBarColor] = useState<string>("");

  useEffect(() => {
    if (!hourlySales.length) return;
    const uniqueHours = hourlySales.reduce((acc: { hour: number }[], curr) => {
      if (!acc.find((h) => h.hour === curr.hour)) {
        acc.push({ hour: curr.hour });
      }
      return acc;
    }, []);

    setHour(uniqueHours[0].hour);
  }, [hourlySales, selectedSalesPanel]);

  const formatDate = (dateStr: string): string => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}`;
  };

  const handleSelect = (param: HourlyTotal) => {
    setHour(Number(param.hour));
    // const avgSales =
    //   rowData.reduce((acc, val) => acc + val.total_sales, 0) / rowData.length;

    // if (param.total_sales > avgSales) {
    //   setBarColor("#10b981");
    // } else if (param.total_sales < avgSales) {
    //   setBarColor("#f97316");
    // } else {
    //   setBarColor("#bfdbfe");
    // }
  };

  useEffect(() => {
    const totals = [...hourlySales].reduce((acc: HourlyTotal[], curr) => {
      const exists = acc.find((d) => d.hour === curr.hour);
      if (exists) {
        exists.total_sales += curr.total_sales - curr.total_tax;
        exists.qty += curr.qty;
      } else {
        acc.push({
          hour: curr.hour,
          total_sales: curr.total_sales - curr.total_tax,
          qty: curr.qty,
        });
      }
      return acc;
    }, []);

    setRowData(totals);
  }, [hourlySales]);

  useEffect(() => {
    const hourFiltered = [...hourlySales]
      .filter((d) => d.hour === hour)
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
    qty: number;
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
    const avgSales = barData.reduce((acc, val) => acc + val.total_sales, 0) / barData.length;
    if (value > avgSales) {
      return "#10b981";
    } else if (value < avgSales) {
      return "#f97316";
    } else {
      return "#bfdbfe";
    }
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg pb-2 pt-1">
      <div className="px-2 font-medium grid grid-cols-3">
        <span className="font-medium">Hourly Sales</span>
        <div className="flex gap-4 text-sm justify-center">
          <div className="flex gap-1 items-center">
            <div className="rounded-full h-3 w-3 bg-orange-500"></div>
            <div>Below Avg</div>
          </div>
          <div className="flex gap-1 items-center">
            <div className="rounded-full h-3 w-3 bg-emerald-500"></div>
            <div>Above Avg</div>
          </div>
        </div>
        <span className="text-right">Hour: {hour}</span>
      </div>
      <div className="h-[93%] grid grid-cols-[40%_59%]">
        <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-scroll p-2 no-scrollbar">
          {rowData.map((r) => (
            <div
              key={`hour-${r.hour}`}
              className={`${r.hour === hour ? "bg-blue-200" : handleAvg(r)} text-sm rounded-lg shadow-content/30 shadow-md p-2 cursor-pointer hover:bg-blue-200 transition-all duration-200`}
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
                <div className="font-medium text-content/60">Qty:</div>
                <div className="font-medium">{formatBigNumber(r.qty, 0)}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <ResponsiveBar
            data={barData}
            margin={{ top: 10, right: 0, bottom: 25, left: 50 }}
            keys={["total_sales"]}
            indexBy="date"
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
            borderColor={(d) => rgbaColor(findBarColor(d.data.data.total_sales), 1)}
            // colors={(d) => rgbaColor(barColor, 0.3)}
            // borderColor={(d) => rgbaColor(barColor, 1)}
            // colors={(d) => rgbaColor("#bfdbfe", 0.3)}
            // borderColor={(d) => rgbaColor("#bfdbfe", 1)}
          />
        </div>
      </div>
    </div>
  );
};

export default HourlyGrid;
