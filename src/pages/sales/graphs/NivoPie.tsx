import { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import type { WeeklySale } from "../../../interfaces";
import { colors } from "../utils";
import { ResponsivePie } from "@nivo/pie";
import { formatBigNumber, formatCurrency2, formatDateSimple } from "../../../utils";
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

const NivoPie = ({ valueKey }: NivoPieProps) => {
  const [pieData, setPieData] = useState<any[]>([]);
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

    console.log(grouped);

    return grouped
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        color: colors[index % colors.length],
      }));
  };

  useEffect(() => {
    if (!state.selectedSalesPanel.storeid) {
      setPieData(formatPieData(state.weeklySales));
      return;
    } else {
      // we have a selected sales panel
      const copy = [...state.weeklySales].filter(
        (sale) => sale.storeid === state.selectedSalesPanel.storeid,
      );
      setPieData(formatPieData(copy));
    }
  }, [state.selectedSalesPanel, state.weeklySales]);

  if (!pieData.length) {
    return (
      <div className="bg-custom-white rounded-lg shadow-lg h-full w-full relative">
        <LoadingIndicator message={`Loading ${valueKey === "total_sales" ? "Sales" : "Quantity"}...`} />
      </div>
    );
  }

  return (
    <div className="bg-custom-white rounded-lg shadow-lg h-full w-full relative">
      <div className="absolute top-0 right-2 font-medium underline">
        {valueKey === "total_sales" ? "Total Sales" : "Total Quantity"}
      </div>
      <ResponsivePie
        data={pieData}
        margin={{ top: 10, right: 90, bottom: 10, left: 0 }}
        colors={(d) => d.data.color as string}
        enableArcLinkLabels={false}
        enableArcLabels={false}
        legends={[
          {
            anchor: "right",
            direction: "column",
            translateY: 20,
            translateX: 100,
            itemWidth: 100,
            itemHeight: 18,
            symbolShape: "circle",
          },
        ]}
        tooltip={(pd) => (
          <div className="flex gap-1 bg-custom-white p-2 text-sm rounded-lg shadow-sm shadow-content">
            <div>{pd.datum.label}</div>
            <div className="font-medium">
              {valueKey === "total_sales"
                ? `${formatCurrency2(pd.datum.value)}`
                : `${formatBigNumber(pd.datum.value)}`}
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default NivoPie;
