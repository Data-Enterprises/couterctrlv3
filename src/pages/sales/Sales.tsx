import { useEffect } from "react";
import { useAppSelector } from "../../hooks";
import { formatGoliathDate } from "../../utils";
import { getTopTen, getHourlyStoreDepts } from "../../api/sales";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";

// Components
import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import WeeklyNetSales from "./WeeklyNetSales";
import DepartmentSales from "./DepartmentSales";
import TopTenItems from "./TopTenItems";
import SalesPanels from "./SalesPanels";

const Sales = () => {
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);

  useEffect(() => {
    if (context.token) {
      getData();
    }
  }, [context.token]);

  const getData = () => {
    // For now I'm formatting the date before the api call since the api needs it that way
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);

    // topten => working
    getTopTen(
      context.url,
      context.token,
      search.lastStore,
      search.type,
      start,
      end
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          console.log("Top Ten Data:", j);
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Top Ten data: " + err.message);
      });

    // hourly store depts => working
    getHourlyStoreDepts(
      context.url,
      context.token,
      search.lastStore,
      start,
      end
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          console.log("Hourly Store Depts Data:", j);
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Hourly Store Depts data: " + err.message);
      });
  };

  return (
    <div
      data-testid="sales-page"
      className="w-full h-[calc(100vh-3rem)] px-4 pt-3"
    >
      <div className="grid grid-cols-4 gap-4">
        <div className="grid gap-4 overflow-scroll max-h-[calc(100vh-70px)] no-scrollbar">
          <div className="bg-custom-white rounded-lg p-2 shadow-lg">
            <StorePicker />
            <DatePickers handleQuery={getData} />
          </div>
          <SalesPanels />
        </div>
        <div className="grid grid-rows-2 col-span-3 gap-4">
          <div className="grid grid-cols-3 gap-4">
            <WeeklyNetSales />
            <DepartmentSales />
            <TopTenItems />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-custom-white rounded-lg p-4 shadow-lg">Subs</div>
            <div className="bg-custom-white rounded-lg p-4 shadow-lg">Cats</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
