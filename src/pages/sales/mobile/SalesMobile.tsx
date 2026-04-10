import { useMobileSalesCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setMobilePanelsLoading,
  setMobileSalesPanels,
  setView,
} from "../../../features/salesMobileSlice";
import { getWeekly } from "../../../api/sales";
import type { JsonError } from "../../../interfaces";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import StorePicker from "../../../components/storePicker/StorePicker";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import MainViewContainer from "./MainViewContainer";

const SalesMobile = () => {
  const toast = useToast();
  const ctx = useMobileSalesCtx();

  const getSalesPanels = () => {
    ctx.dispatch(setMobilePanelsLoading(true));
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
          const sorted = [...j.sales].sort(
            (a, b) =>
              new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime(),
          );
          ctx.dispatch(setMobileSalesPanels(sorted));
          ctx.dispatch(setView('sales'));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching sales panels: " + err.message),
      )
      .finally(() => ctx.dispatch(setMobilePanelsLoading(false)));
  };

  // Here is where the main view can be toggled once the sales panels are set
  if (ctx.view !== 'main') return <MainViewContainer />

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
      {ctx.panelsLoading ? (
        <div className="h-[35vh] relative">
          <LoadingIndicator message={`Loading sales`} className="ml-1" />
        </div>
      ) : null}
    </div>
  );
};

export default SalesMobile;
