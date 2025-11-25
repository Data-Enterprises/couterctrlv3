import { useEffect } from "react";
import { useAppSelector } from "../../../hooks";

const Subs = () => {
  const sales = useAppSelector((state) => state.sales);

  useEffect(() => {
    if (sales.subSales.length === 0) return;

    // When we load the subSales data, log it for now
    console.log("subs data updated: ", sales.subSales);
  }, [sales.subSales]);

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
      </div>
    </div>
  );
};

export default Subs;
