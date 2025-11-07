// HOOKS
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { formatGoliathDate } from "../../utils";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";
import {
  getTopTen,
  getHourlyStoreDepts,
  salesTwoDates,
  getWeekly,
} from "../../api/sales";
import {
  setTopTenItems,
  setDepartmentSales,
  setSalesPanels,
  resetSalesSlice,
  setWeeklySales,
  setPanelsLoading,
} from "../../features/salesSlice";

// Components
import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import WeeklyNetSales from "./components/WeeklyNetSales";
import DepartmentSales from "./components/DepartmentSales";
import TopTenItems from "./components/TopTenItems";
import SalesPanels from "./panels/SalesPanels";

const Sales = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { topTenItems, departmentSales } = useAppSelector(
    (state) => state.sales
  );

  useEffect(() => {
    // On mount
    if (context.token) {
      getData();
    }

    return () => {
      dispatch(resetSalesSlice());
    };
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
          dispatch(setTopTenItems(j.items));
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
          dispatch(setDepartmentSales(j.sales));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Hourly Store Depts data: " + err.message);
      });

    const useGroups =
      search.type.toString() == "2" || search.type.toString() == "Group"
        ? 1
        : 0;
    const singleStore =
      search.type.toString() == "2" || search.type.toString() == "Group"
        ? 0
        : 1;
    dispatch(setPanelsLoading(true));
    salesTwoDates(
      context.url,
      context.token,
      start,
      end,
      useGroups,
      search.lastStore,
      singleStore
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSalesPanels(j.items));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Sales Two Dates data: " + err.message);
      })
      .finally(() => dispatch(setPanelsLoading(false)));

    getWeekly(context.url, context.token, search.lastStore, start, end)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setWeeklySales(j.sales));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching weekly data: " + err.message)
      );
  };

  const isReady = topTenItems.length > 0 && departmentSales.length > 0;

  return (
    <div
      data-testid="sales-page"
      className={`w-full h-[calc(100vh-3rem)] px-4 pt-4 ${
        isReady ? "animate-windowIn" : "hidden"
      }`}
    >
      <div className="grid grid-cols-4 gap-4 h-full">
        <div className="grid gap-2 overflow-scroll max-h-[calc(100vh-7px)] grid-rows-[0.7fr_1fr_1fr] no-scrollbar mb-4">
          <div className="bg-custom-white rounded-lg p-2 shadow-lg">
            <StorePicker />
            <DatePickers handleQuery={getData} btnPadding="py-1" />
          </div>
          <TopTenItems />
          <DepartmentSales />
        </div>
        <div className="grid grid-rows-2 col-span-3 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <WeeklyNetSales />
            <div className="bg-custom-white rounded-lg p-2 shadow-lg flex flex-col justify-center items-center">
              <div>Subs and Cats</div>
              <div>Selecting a sales panel below will show this data</div>
              <div>
                By default, the first card if there was no last store or group
                selected
              </div>
            </div>
          </div>
          <SalesPanels />
        </div>
      </div>
    </div>
  );
};

export default Sales;
