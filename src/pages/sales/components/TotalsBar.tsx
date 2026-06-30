import { useSalesState } from "../hooks/useSalesState";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import type { WeeklySale } from "../../../interfaces";
import { colors, rgbaColor } from "../utils";
import { ResponsiveBar } from "@nivo/bar";
import { formatCurrency2, formatDateSimple } from "../../../utils";

type PieData = {
  id: string;
  label: string;
  value: number;
  color: string;
};

const TotalsBar = () => {
  const [barData, setBarData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<string>("");
  const state = useSalesState();

  const formatBarData = (data: WeeklySale[]): PieData[] => {
    if (data.length === 0) return [];
    const grouped: PieData[] = data.reduce((acc: PieData[], curr) => {
      const exists = acc.find(
        (item) => item.label === formatDateSimple(curr.sale_date.split("T")[0]),
      );
      if (!exists) {
        acc.push({
          id: formatDateSimple(curr.sale_date.split("T")[0]),
          label: formatDateSimple(curr.sale_date.split("T")[0]),
          value: curr.total_sales - curr.total_tax,
          color: "",
        });
      } else {
        exists.value += curr.total_sales - curr.total_tax;
      }
      return acc;
    }, []);

    return grouped.map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
    }));
  };

  useEffect(() => {
    const data =
      state.selectedSalesPanel.storeid > 0
        ? [...state.weeklySales].filter(
            (sale) => sale.storeid === state.selectedSalesPanel.storeid,
          )
        : [...state.weeklySales];

    const dates = Array.from(
      new Set(data.map((d) => d.sale_date.split("T")[0])),
    ).sort();

    setDateRange(
      `${formatDateSimple(dates[0])} - ${formatDateSimple(dates[dates.length - 1])}`,
    );

    setBarData(formatBarData(data));
  }, [state.selectedSalesPanel, state.weeklySales]);

  const setMarginLeft = () => {
    return barData.length > 6 ? 75 : 75;
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg h-[190px] md:h-full w-full relative">
      <div className="font-medium rounded-t-lg flex justify-between px-2 py-0.5 text-[13px]">
        <div>Daily Sales</div>
        <div>{dateRange}</div>
      </div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <ResponsiveBar
        data={barData}
        key={"total_sales"}
        margin={{
          top: 15,
          right: 5,
          bottom: 51,
          left: setMarginLeft(),
        }}
        colors={() => rgbaColor("#3b82f6", 0.3)}
        borderWidth={2}
        borderColor={() => "#3b82f6"}
        padding={0.07}
        enableLabel={false}
        enableGridX={false}
        enableGridY={false}
        borderRadius={4}
        valueScale={{
          type: "linear",
          clamp: true,
          max: Math.max(...barData.map((d) => d.value)) * 1.1,
        }}
        axisBottom={{
          format: (v) => `${v.split("/").slice(0, 2).join("/")}`,
        }}
        axisLeft={{
          tickValues: 4,
          format: (v) => `${formatCurrency2(Number(v))}`,
        }}
        theme={{
          axis: {
            domain: {
              line: { stroke: "#60a5fa", strokeWidth: 1.5 },
            },
            ticks: {
              text: { fontSize: 10.5, strokeWidth: 2, fontWeight: "bolder" },
            },
          },
        }}
        tooltip={({ value }) => (
          <div className="p-2 bg-white shadow-lg rounded text-sm text-nowrap">
            <strong>{formatCurrency2(value)}</strong>
          </div>
        )}
      />
    </div>
  );
};

export default TotalsBar;
