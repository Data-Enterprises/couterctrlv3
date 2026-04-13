import { useMobileSalesCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  resetMobileSalesState,
  setMobileHourlySales,
  setMobilePanelsLoading,
  setMobileSalesPanels,
  setMobileSubSales,
  setMobileWeeklySales,
  setView,
} from "../../../features/salesMobileSlice";
import { getHourly, getSubs, getWeekly } from "../../../api/sales";
import type { JsonError, WeeklySale } from "../../../interfaces";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import StorePicker from "../../../components/storePicker/StorePicker";
// import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import MainViewContainer from "./MainViewContainer";

const SalesMobile = () => {
  const toast = useToast();
  const ctx = useMobileSalesCtx();

  const getSalesPanels = () => {
    ctx.dispatch(resetMobileSalesState());

    getSubs(
      ctx.url,
      ctx.token,
      ctx.startDate,
      ctx.endDate,
      ctx.useGroups,
      ctx.searchValue,
      ctx.singleStore,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setMobileSubSales(j.subs));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching sub sales: " + err.message),
      );

    getWeekly(
      ctx.url,
      ctx.token,
      ctx.startDate,
      ctx.endDate,
      ctx.useGroups,
      ctx.searchValue,
      ctx.singleStore,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const sorted: WeeklySale[] = [...j.sales].sort(
            (a, b) =>
              new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime(),
          );
          ctx.dispatch(setMobileSalesPanels(sorted));
          ctx.dispatch(setMobileWeeklySales(sorted));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching sales panels: " + err.message),
      )
      .finally(() => ctx.dispatch(setMobilePanelsLoading(false)));

    getHourly(
      ctx.url,
      ctx.token,
      ctx.startDate,
      ctx.endDate,
      ctx.useGroups,
      ctx.searchValue,
      ctx.singleStore,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setMobileHourlySales(j.subs));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching hourly sales: " + err.message),
      );

    // Change the view after the calls are made
    ctx.dispatch(setView("stores"));
  };

  // Here is where the main view can be toggled once the sales panels are set
  if (ctx.view !== "main") return <MainViewContainer />;

  // Default return if view is 'main'
  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-scroll no-scrollbar p-2 select-none text-[13px]">
      <div className="bg-custom-white rounded-lg shadow-md p-2 mb-2">
        <StorePicker />
        <SingleDatePicker />
        <button className="btn-themeBlue w-full mt-2" onClick={getSalesPanels}>
          Search
        </button>
      </div>
      {/* {ctx.panelsLoading ? (
        <div className="h-[35vh] relative">
          <LoadingIndicator message={`Loading sales`} className="ml-1" />
        </div>
      ) : null} */}
    </div>
  );
};

export default SalesMobile;
