import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../hooks";
// import type { SalesBarData } from "../../../interfaces";
// import { formatCurrency2 } from "../../../utils";

import SubCard from "./SubCard";

// type NewBarData = {
//   date: string;
// } & SalesBarData;

const useHeight = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(385);

  useEffect(() => {
    const calcHeight = () => {
      if (topRef.current && bottomRef.current) {
        const topHeight = topRef.current.getBoundingClientRect().height;
        const bottomHeight = bottomRef.current.getBoundingClientRect().height;
        setHeight(topHeight - bottomHeight);
      }
    };
    calcHeight();
    window.addEventListener("resize", calcHeight);
    return () => window.removeEventListener("resize", calcHeight);
  });

  return { topRef, bottomRef, height };
};

const Subs = () => {
  const sales = useAppSelector((state) => state.sales);
  const { topRef, bottomRef, height } = useHeight();
  // const [subsData, setSubsData] = useState<NewBarData[]>([]);

  useEffect(() => {
    if (sales.subSales.length === 0) return;

    console.log("ENDPOINT: subs/sub_sales");
    console.log(" ");
    
    const testing = [...sales.subSales].reduce(
      (acc, cur) => acc + cur.total_sales,
      0
    );
    console.log("Total Sales from subs/sub_sales: ", testing);
    console.log(" ");

    const netTest = [...sales.weeklySales].reduce(
      (acc, cur) => acc + cur.net_sales,
      0
    );
    console.log("Net Sales from subs/sub_sales: ", netTest);
    console.log(" ");

    const taxTest = [...sales.subSales].reduce(
      (acc, cur) => acc + (cur.net_sales + cur.total_tax),
      0
    );
    console.log("Net Sales + Tax from subs/sub_sales: ", taxTest);
    console.log(" ");

    const qtyTest = [...sales.subSales].reduce(
      (acc, cur) => acc + cur.qty,
      0
    );
    console.log("Qty from subs/sub_sales: ", qtyTest);
    console.log(" ");

    // When we get new sub sales data from redux, map it to the bar data format
    // const newSubsData = sales.subSales.map((sub) => ({
    //   id: sub.sub_department,
    //   label: sub.sub_department_description,
    //   value: sub.total_sales,
    //   fill: "#3b82f6",
    //   color: "#3b82f6",
    //   qty: sub.qty,
    //   date: sub.sale_date.split("T")[0],
    // })).reduce((acc: NewBarData[], cur) => {
    //   const existing = acc.find((item) => item.label === cur.label);
    //   if (existing) {
    //     existing.value += cur.value;
    //     existing.qty += cur.qty;
    //   } else {
    //     acc.push(cur);
    //   }
    //   return acc;
    // }, []);
    // setSubsData(newSubsData);

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

  return (
    <div
      className={`w-full h-full bg-custom-white rounded-lg shadow-lg  ${
        sales.windowVisible.subs ? "" : "hidden"
      }`}
      ref={topRef}
    >
      <div>
        <div
          ref={bottomRef}
          className="bg-blue-500 text-custom-white flex justify-between py-0.5 px-4 font-medium rounded-t-lg"
        >
          <div>Sub Department Sales</div>
        </div>
        <div
          className={`grid grid-cols-2 no-scrollbar overflow-y-scroll p-2 gap-2`}
          style={{ height: height, maxHeight: height }}
        >
          {sales.subSales.map((sub, i) => (
            <SubCard key={i} sub={sub} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subs;
