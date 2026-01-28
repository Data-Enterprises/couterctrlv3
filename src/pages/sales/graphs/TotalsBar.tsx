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
  const search = useAppSelector((state) => state.search);
  const user = useAppSelector((state) => state.user);
  const groups = useAppSelector((state) => state.group);

  const formatPieData = (data: WeeklySale[]): PieData[] => {
    const grouped: PieData[] = data.reduce((acc: PieData[], curr) => {
      const exists = acc.find(
        (item) => item.label === formatDateSimple(curr.sale_date.split("T")[0]),
      );
      if (!exists) {
        acc.push({
          id: formatDateSimple(curr.sale_date.split("T")[0]),
          label: formatDateSimple(curr.sale_date.split("T")[0]),
          value: (curr[valueKey] as number) - curr.total_tax,
          color: "",
        });
      } else {
        exists.value += (curr[valueKey] as number) - curr.total_tax;
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

  const setMarginLeft = () => {
    if (barData.some((d) => d.value > 99999)) {
      return barData.length > 6 ? 80 : valueKey === "total_sales" ? 75 : 55;
    }

    if (valueKey === "total_sales") {
      return barData.length > 6 ? 70 : 60;
    } else {
      return 50;
    }
  };

  const renderTitle = () => {
    if (state.selectedSalesPanel.storeid) {
      return `${state.selectedSalesPanel.store_name}`;
    } else {
      const storeName = user.assignedStores.filter((s) => s.storeid === search.lastStore)[0]?.store_name;
      const groupName = groups.groups.filter((g) => g.id === search.lastGroup)[0]?.group_name;
      return search.type === "Store" ? `${storeName}` : `${groupName}`;
    }
    
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg h-full w-full relative">
      <div className="bg-blue-500 text-custom-white font-medium rounded-t-lg flex justify-between px-2 py-0.5">
        <div>{valueKey === "total_sales" ? "Sales" : "Quantity"}</div>
        <div>{renderTitle()}</div>
      </div>
      <ResponsiveBar
        data={barData}
        key={valueKey}
        margin={{ top: 15, right: 5, bottom: 60, left: setMarginLeft() }}
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
                : formatBigNumber(value, 0)}
            </strong>
          </div>
        )}
      />
    </div>
  );
};

export default TotalsBar;
