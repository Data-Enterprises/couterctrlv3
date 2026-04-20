import { useMobileSalesCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  resetMobileSalesState,
  setMobileHourlyLastYearSales,
  setMobileHourlySales,
  setMobilePanelsLoading,
  setMobileSalesPanels,
  setMobileSubSales,
  setMobileSubSalesWk2,
  setMobileSubSalesWk3,
  setMobileTopTenItems,
  setMobileWeeklySales,
  setMobileWeeklySalesLastYear,
  setSelectedSubDept,
  setView,
} from "../../../features/salesMobileSlice";
import { getHourly, getSubs, getTopTen, getWeekly } from "../../../api/sales";
import type { JsonError, WeeklySale } from "../../../interfaces";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import StorePicker from "../../../components/storePicker/StorePicker";
// import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import MainViewContainer from "./MainViewContainer";
import { sameWeekDayLastYear } from "../../../utils";
import { setDates } from "../utils";

const SalesMobile = () => {
  const toast = useToast();
  const ctx = useMobileSalesCtx();

  const getSalesPanels = () => {
    ctx.dispatch(resetMobileSalesState());

    const endDateLY = sameWeekDayLastYear(ctx.endDate);
    const lyDate = new Date(endDateLY.date);
    const lyWkEnd = setDates(lyDate);
    const lyWkStart = setDates(lyDate, 6);

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
          ctx.dispatch(setSelectedSubDept(j.subs[0].sub_department));
          ctx.dispatch(setMobileSubSales(j.subs));

          // Get last week
          const wk2EndDate = new Date(ctx.endDate);
          const wk2End = setDates(wk2EndDate, 7);
          const wk2Start = setDates(wk2EndDate, 13);

          getSubs(
            ctx.url,
            ctx.token,
            wk2Start,
            wk2End,
            ctx.useGroups,
            ctx.searchValue,
            ctx.singleStore,
          )
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                ctx.dispatch(setMobileSubSalesWk2(j.subs));
              }
            })
            .catch((err: JsonError) => toast.error(err.message));

          // Then fetch last year
          getSubs(
            ctx.url,
            ctx.token,
            lyWkStart,
            lyWkEnd,
            ctx.useGroups,
            ctx.searchValue,
            ctx.singleStore,
          )
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                ctx.dispatch(setMobileSubSalesWk3(j.subs));
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));

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

          // Then fetch last year
          getWeekly(
            ctx.url,
            ctx.token,
            lyWkStart,
            lyWkEnd,
            ctx.useGroups,
            ctx.searchValue,
            ctx.singleStore,
          )
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                const sorted: WeeklySale[] = [...j.sales].sort(
                  (a, b) =>
                    new Date(b.sale_date).getTime() -
                    new Date(a.sale_date).getTime(),
                );
                ctx.dispatch(setMobileWeeklySalesLastYear(sorted));
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
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

          // Then fetch last year
          getHourly(
            ctx.url,
            ctx.token,
            lyWkStart,
            lyWkEnd,
            ctx.useGroups,
            ctx.searchValue,
            ctx.singleStore,
          )
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                ctx.dispatch(setMobileHourlyLastYearSales(j.subs));
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching hourly sales: " + err.message),
      );

    getTopTen(
      ctx.url,
      ctx.token,
      ctx.searchValue,
      ctx.type,
      ctx.startDate,
      ctx.endDate,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setMobileTopTenItems(j.items));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching top ten items: " + err.message),
      );

    // Change the view after the calls are made
    ctx.dispatch(setView("stores"));
  };

  // Here is where the main view can be toggled once the sales panels are set
  if (ctx.view !== "main") return <MainViewContainer />;

  const showBtn =
    ctx.salesPanels.length > 0 &&
    ctx.subSales.length > 0 &&
    ctx.weeklySales.length > 0;

  // Default return if view is 'main'
  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-scroll no-scrollbar p-2 select-none text-[13px]">
      <div className="bg-custom-white rounded-lg shadow-md p-2 mb-2">
        <StorePicker />
        <SingleDatePicker />
        <button className="btn-themeBlue w-full mt-2" onClick={getSalesPanels}>
          Search
        </button>
        {showBtn && (
          <button
            className="btn-themeBlue w-full mt-2"
            onClick={() => ctx.dispatch(setView("stores"))}
          >
            Overview
          </button>
        )}
      </div>
    </div>
  );
};

export default SalesMobile;
