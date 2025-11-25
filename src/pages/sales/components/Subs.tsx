import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { rgbaColor } from "../utils";
import type { SalesBarData } from "../../../interfaces";
import { ResponsiveBar } from "@nivo/bar";
import { formatCurrency2 } from "../../../utils";
// import { ResponsiveHeatMap } from "@nivo/heatmap";

type NewBarData = {
  date: string;
} & SalesBarData;

// type HeatMapData = {
//   id: string;
//   data: {
//     x: string;
//     y: number;
//   }[];
// }

const Subs = () => {
  const sales = useAppSelector((state) => state.sales);
  const [subsData, setSubsData] = useState<NewBarData[]>([]);

  useEffect(() => {
    if (sales.subSales.length === 0) return;

    // When we get new sub sales data from redux, map it to the bar data format
    const newSubsData = sales.subSales.map((sub) => ({
      id: sub.sub_department,
      label: sub.sub_department_description,
      value: sub.total_sales,
      fill: "#3b82f6",
      color: "#3b82f6",
      qty: sub.qty,
      date: sub.sale_date.split("T")[0],
    })).reduce((acc: NewBarData[], cur) => {
      const existing = acc.find((item) => item.label === cur.label);
      if (existing) {
        existing.value += cur.value;
        existing.qty += cur.qty;
      } else {
        acc.push(cur);
      }
      return acc;
    }, []);
    setSubsData(newSubsData);

    // const test = () => {
    //   const copy = [...sales.subSales];
    //   /**
    //    * id: sale_date
    //    * data: {
    //    *  x: sub_department_description,
    //    *  y: total_sales
    //    * }
    //    */

    //   return copy.reduce((acc: HeatMapData[], cur) => {
    //     const found = acc.find(item => item.id === cur.sale_date.split("T")[0]);
    //     if (found) {
    //       found.data.push({
    //         x: cur.sub_department_description,
    //         y: cur.total_sales,
    //       });
    //     } else {
    //       acc.push({
    //         id: cur.sale_date.split("T")[0],
    //         data: [{
    //           x: cur.sub_department_description,
    //           y: cur.total_sales,
    //         }]
    //       });
    //     }
    //     return acc;
    //   }, []);
    // };

    // console.log(test());
  }, [sales.subSales]);

  // console.log(subsData);

  const handleDate = (dateStr: string) => {
    if (!dateStr) return "";
    // yyyy-mm-dd => mm/dd/yyyy
    const parts = dateStr.split("-");
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  };

  return (
    <div
      className={`w-full h-full bg-custom-white rounded-lg shadow-lg  ${
        sales.windowVisible.subs ? "" : "hidden"
      }`}
    >
      <div className="h-[calc(100%-2px)]">
        <div className="bg-blue-500 text-custom-white flex justify-between py-0.5 px-4 font-medium rounded-t-lg">
          <div>Sub Department Sales</div>
          <div className="flex gap-4">
            <div>{sales.selectedSalesPanel.store_name}</div>
            <div>
              {handleDate(sales.selectedSalesPanel.sale_date.split("T")[0])}
            </div>
          </div>
        </div>
        <div className={`h-[100%] relative`}>
          <ResponsiveBar
            data={subsData}
            indexBy="label"
            colors={(bar) => rgbaColor(bar.data.fill, 0.3)}
            borderWidth={2}
            borderColor={(bar) => rgbaColor(bar.data.data.color, 1)}
            margin={{ top: 20, right: 20, bottom: 70, left: 180 }}
            padding={0.1}
            borderRadius={4}
            labelSkipWidth={12}
            labelSkipHeight={12}
            keys={["value"]}
            layout="horizontal"
            enableLabel={false}
            // axisLeft={{
            //   tickSize: 5,
            //   tickPadding: 5,
            //   tickRotation: 0,
            //   legend: "",
            //   legendPosition: "middle",
            //   legendOffset: -55,
            //   format: (value) => `$${value}`,
            // }}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "",
              legendPosition: "middle",
              legendOffset: 35,
              format: (value) => `$${formatCurrency2(value)}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Subs;
