import { useAppSelector } from "../../../hooks";
import { useHeight } from "../../hooks";
import SubCard from "./SubCard";

// type NewBarData = {
//   date: string;
// } & SalesBarData;

const Subs = () => {
  const sales = useAppSelector((state) => state.sales);
  const { topRef, bottomRef, height } = useHeight();

//   useEffect(() => {
//     if (sales.subSales.length === 0) return;

//     // console.log("ENDPOINT: subs/sub_sales");
//     // console.log(" ");
    
//     // const testing = [...sales.subSales].reduce(
//     //   (acc, cur) => acc + cur.total_sales,
//     //   0
//     // );
//     // console.log("Total Sales from subs/sub_sales: ", testing);
//     // console.log(" ");

//     // const netTest = [...sales.weeklySales].reduce(
//     //   (acc, cur) => acc + cur.net_sales,
//     //   0
//     // );
//     // console.log("Net Sales from subs/sub_sales: ", netTest);
//     // console.log(" ");

//     // const taxTest = [...sales.subSales].reduce(
//     //   (acc, cur) => acc + (cur.net_sales + cur.total_tax),
//     //   0
//     // );
//     // console.log("Net Sales + Tax from subs/sub_sales: ", taxTest);
//     // console.log(" ");

//     // const qtyTest = [...sales.subSales].reduce(
//     //   (acc, cur) => acc + cur.qty,
//     //   0
//     // );
//     // console.log("Qty from subs/sub_sales: ", qtyTest);
//     // console.log(" ");

// }, [sales.subSales]);

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
