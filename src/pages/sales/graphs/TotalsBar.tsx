import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import type { WeeklySale } from "../../../interfaces";
import { colors, rgbaColor } from "../utils";
import { ResponsiveBar } from "@nivo/bar";
import {
  formatBigNumber,
  formatCurrency2,
  formatDateSimple,
} from "../../../utils";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

type PieData = {
  id: string;
  label: string;
  value: number;
  color: string;
};

interface NivoPieProps {
  valueKey: keyof WeeklySale;
}

const TotalsBar = ({ valueKey }: NivoPieProps) => {
  const [barData, setBarData] = useState<any[]>([]);
  const state = useAppSelector((state) => state.sales);

  const formatPieData = (data: WeeklySale[]): PieData[] => {
    const grouped: PieData[] = data.reduce((acc: PieData[], curr) => {
      const exists = acc.find(
        (item) => item.label === formatDateSimple(curr.sale_date.split("T")[0]),
      );
      if (!exists) {
        acc.push({
          id: formatDateSimple(curr.sale_date.split("T")[0]),
          label: formatDateSimple(curr.sale_date.split("T")[0]),
          value: curr[valueKey] as number,
          color: "",
        });
      } else {
        exists.value += curr[valueKey] as number;
      }
      return acc;
    }, []);

    return grouped.map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
    }));
  };

  useEffect(() => {
    if (!state.selectedSalesPanel.storeid) {
      setBarData(formatPieData(state.weeklySales));
      return;
    } else {
      // we have a selected sales panel
      const copy = [...state.weeklySales].filter(
        (sale) => sale.storeid === state.selectedSalesPanel.storeid,
      );
      setBarData(formatPieData(copy));
    }
  }, [state.selectedSalesPanel, state.weeklySales]);

  if (!barData.length) {
    return (
      <div className="bg-custom-white rounded-lg shadow-lg h-full w-full relative">
        <LoadingIndicator
          message={`Loading ${valueKey === "total_sales" ? "Sales" : "Quantity"}...`}
        />
      </div>
    );
  }

  const setMarginLeft = () => {
    if (barData.some((d) => d.value > 99999)) {
      return 75;
    }

    if (valueKey === "total_sales") {
      return 60;
    } else {
      return 50;
    }
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg h-full w-full relative">
      <div className="absolute top-0 right-2 font-medium underline">
        {valueKey === "total_sales" ? "Total Sales" : "Total Quantity"}
      </div>
      <ResponsiveBar
        data={barData}
        key={valueKey}
        margin={{ top: 20, right: 5, bottom: 30, left: setMarginLeft() }}
        colors={() => rgbaColor("#3b82f6", 0.3)}
        borderWidth={2}
        borderColor={() => "#3b82f6"}
        padding={0.07}
        enableLabel={false}
        enableGridX={false}
        enableGridY={false}
        borderRadius={4}
        axisBottom={{
          tickValues: 5,
          format: (v) => `${v.split("/").slice(0, 2).join("/")}`,
        }}
        axisLeft={{
          tickValues: 5,
          format: (v) =>
            valueKey === "total_sales"
              ? `${formatCurrency2(Number(v))}`
              : formatBigNumber(Number(v), 0),
        }}
        gridXValues={5}
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
            <strong>
              {valueKey === "total_sales"
                ? formatCurrency2(value)
                : formatBigNumber(value)}
            </strong>
          </div>
        )}
      />
    </div>
  );
};

export default TotalsBar;
