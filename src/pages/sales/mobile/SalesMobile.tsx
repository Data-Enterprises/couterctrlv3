import { useEffect, useState } from "react";
import { useMobileSalesCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  concatLYSubTrackerMobile,
  concatTYSubTrackerMobile,
  resetMobileSalesState,
  setLoadingLYTrackerData,
  setLoadingTYTrackerData,
  setMobileDashboardOption,
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
import MainViewContainer from "./MainViewContainer";
import { formatGoliathDate, sameWeekDayLastYear } from "../../../utils";
import { setDates } from "../utils";

import {
  CurrencyDollarIcon,
  ClipboardDocumentIcon,
  DocumentCurrencyDollarIcon,
} from "@heroicons/react/24/solid";
import type { DashboardOption } from "../../../features/salesSlice";
import { useAppSelector } from "../../../hooks";
import DatePickers from "../../../components/datePickers/DatePickers";
import { formatDate } from "../tracker";
import NoPanelsFound from "../NoPanelsFound";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

const SalesMobile = () => {
  const toast = useToast();
  const ctx = useMobileSalesCtx();
  const search = useAppSelector((state) => state.search);
  const [noPanelsFound, setNoPanelsFound] = useState<boolean>(false);

  useEffect(() => {
    if (ctx.thisYrSubTrackerMobile.length > 0) {
      setNoPanelsFound(false);
      ctx.dispatch(setView("tracker"));
    }
  }, [ctx.thisYrSubTrackerMobile]);

  useEffect(() => {
    if (ctx.salesPanels.length > 0) {
      setNoPanelsFound(false);
      ctx.dispatch(setView("stores"));
    }
  }, [ctx.salesPanels]);

  useEffect(() => {
    if (ctx.selectedStore.storeid) return;

    const endDateLY = sameWeekDayLastYear(ctx.endDate);
    const lyDate = new Date(endDateLY.date);
    const lyWkEnd = setDates(lyDate);
    const lyWkStart = setDates(lyDate, 6);
    const start = ctx.dashboardOption === "daily" ? ctx.endDate : ctx.startDate;

    getSubs(
      ctx.url,
      ctx.token,
      start,
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
          const startTwo = ctx.dashboardOption === "daily" ? wk2End : wk2Start;

          getSubs(
            ctx.url,
            ctx.token,
            startTwo,
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

          const lyStart = ctx.dashboardOption === "daily" ? lyWkEnd : lyWkStart;
          // Then fetch last year
          getSubs(
            ctx.url,
            ctx.token,
            lyStart,
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
  }, [ctx.selectedStore, ctx.startDate]);

  const getSalesPanels = () => {
    ctx.dispatch(resetMobileSalesState());
    setNoPanelsFound(false);
    ctx.dispatch(setMobilePanelsLoading(true));

    if (ctx.dashboardOption === "tracker") {
      getSubsTracker();
      return;
    }

    const endDateLY = sameWeekDayLastYear(ctx.endDate);
    const lyDate = new Date(endDateLY.date);
    const lyWkEnd = setDates(lyDate);
    const lyWkStart = setDates(lyDate, 6);
    const start = ctx.dashboardOption === "daily" ? ctx.endDate : ctx.startDate;

    getSubs(
      ctx.url,
      ctx.token,
      start,
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
          const startTwo = ctx.dashboardOption === "daily" ? wk2End : wk2Start;

          getSubs(
            ctx.url,
            ctx.token,
            startTwo,
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

          const lyStart = ctx.dashboardOption === "daily" ? lyWkEnd : lyWkStart;
          // Then fetch last year
          getSubs(
            ctx.url,
            ctx.token,
            lyStart,
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
          if (ctx.dashboardOption === "daily") {
            const found = sorted.find(
              (s) => formatDate(s.sale_date) === formatDate(start),
            );
            if (found) {
              ctx.dispatch(setMobileSalesPanels([found]));
            } else {
              setNoPanelsFound(true);
            }
          } else {
            ctx.dispatch(setMobileSalesPanels(sorted));
          }
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
      start,
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
          const lyStart = ctx.dashboardOption === "daily" ? lyWkEnd : lyWkStart;
          getHourly(
            ctx.url,
            ctx.token,
            lyStart,
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

    getTopTen(ctx.url, ctx.token, ctx.searchValue, ctx.type, start, ctx.endDate)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setMobileTopTenItems(j.items));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching top ten items: " + err.message),
      );
  };

  const getSubsTracker = () => {
    ctx.dispatch(setLoadingTYTrackerData(true));
    ctx.dispatch(setLoadingLYTrackerData(true));
    const end = formatGoliathDate(search.endDate);
    const start = formatGoliathDate(search.startDate);

    const endDateLY = sameWeekDayLastYear(search.endDate).date;
    const startDateLY = sameWeekDayLastYear(search.startDate).date;

    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    // This Year
    getSubs(
      ctx.url,
      ctx.token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
      0,
      0,
      1,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          ctx.dispatch(concatTYSubTrackerMobile(j.subs));
          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) {
              pages.push({ page, fetched: false });
            }

            for (let page = 2; page <= j.total_pages; page++) {
              getSubs(
                ctx.url,
                ctx.token,
                start,
                end,
                useGroups,
                searchValue,
                singleStore,
                0,
                0,
                page,
              )
                .then((resp) => {
                  const j = resp.data;
                  if (j.error === 0) {
                    ctx.dispatch(concatTYSubTrackerMobile(j.subs));
                    pages.find((p) => p.page === page)!.fetched = true;

                    if (pages.every((p) => p.fetched)) {
                      ctx.dispatch(setLoadingTYTrackerData(false));
                    }
                  }
                })
                .catch((err: JsonError) => toast.error(err.message));
            }
          } else {
            ctx.dispatch(setLoadingTYTrackerData(false));
          }
        } else {
          setNoPanelsFound(true);
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setMobilePanelsLoading(false)));

    // Getting Last Year
    getSubs(
      ctx.url,
      ctx.token,
      startDateLY,
      endDateLY,
      useGroups,
      searchValue,
      singleStore,
      0,
      0,
      1,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          ctx.dispatch(concatLYSubTrackerMobile(j.subs));
          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) {
              pages.push({ page, fetched: false });
            }

            for (let page = 2; page <= j.total_pages; page++) {
              getSubs(
                ctx.url,
                ctx.token,
                startDateLY,
                endDateLY,
                useGroups,
                searchValue,
                singleStore,
                0,
                0,
                page,
              )
                .then((resp) => {
                  const j = resp.data;
                  if (j.error === 0) {
                    ctx.dispatch(concatLYSubTrackerMobile(j.subs));
                    pages.find((p) => p.page === page)!.fetched = true;

                    if (pages.every((p) => p.fetched)) {
                      ctx.dispatch(setLoadingLYTrackerData(false));
                    }
                  }
                })
                .catch((err: JsonError) => toast.error(err.message));
            }
          } else {
            ctx.dispatch(setLoadingLYTrackerData(false));
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message));

    // ctx.dispatch(setView("tracker"));
  };

  // Here is where the main view can be toggled once the sales panels are set
  if (ctx.view !== "main") return <MainViewContainer />;

  const showBtn =
    ctx.salesPanels.length > 0 &&
    ctx.subSales.length > 0 &&
    ctx.weeklySales.length > 0;

  const showTrackerBtn = ctx.tyReducedTotalsMobile.length > 0;

  const activeStyle = (dbOption: DashboardOption) => {
    return ctx.dashboardOption === dbOption
      ? "text-orange-500"
      : "text-content/60";
  };

  const handleDashboardSelect = (option: DashboardOption) => {
    ctx.dispatch(setMobileDashboardOption(option));
  };

  const uniqueDates = (): number => {
    const dates = ctx.salesPanels.map((panel) => panel.sale_date);
    return Array.from(new Set(dates)).length;
  };

  // Default return if view is 'main'
  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-scroll no-scrollbar select-none text-[13px]">
      <div className="flex justify-items-center bg-custom-white shadow-md py-2 text-[12px]">
        <div
          className="border-r w-1/3 flex justify-center gap-2 items-center transition-all"
          onClick={() => handleDashboardSelect("daily")}
        >
          <CurrencyDollarIcon
            className={`h-6 w-6 transition-all duration-200 ${activeStyle("daily")}`}
          />
          Daily
        </div>
        <div
          className="border-r w-1/3 flex justify-center gap-2 items-center transition-all"
          onClick={() => handleDashboardSelect("weekly")}
        >
          <DocumentCurrencyDollarIcon
            className={`h-6 w-6 transition-all duration-200 ${activeStyle("weekly")}`}
          />
          Weekly
        </div>
        <div
          className="w-1/3 flex justify-center gap-2 items-center transition-all"
          onClick={() => handleDashboardSelect("tracker")}
        >
          <ClipboardDocumentIcon
            className={`h-6 w-6 transition-all duration-200 ${activeStyle("tracker")}`}
          />
          Tracker
        </div>
      </div>
      <div className="p-2">
        <div className="bg-custom-white rounded-lg shadow-md p-2 mb-2">
          <StorePicker />

          {ctx.dashboardOption !== "tracker" ? (
            <SingleDatePicker />
          ) : (
            <div className="mt-2">
              <DatePickers showBtn={false} />
            </div>
          )}

          <button
            className="btn-themeBlue w-full mt-2"
            onClick={getSalesPanels}
          >
            Search
          </button>
          {showBtn && (
            <button
              className="btn-themeBlue w-full mt-2"
              onClick={() => ctx.dispatch(setView("stores"))}
            >
              {uniqueDates() < 2 ? "Daily Sales" : "Weekly Sales"}
            </button>
          )}

          {showTrackerBtn && (
            <button
              className="btn-themeBlue w-full mt-2"
              onClick={() => ctx.dispatch(setView("tracker"))}
            >
              Sales Tracker
            </button>
          )}
        </div>
      </div>
      {noPanelsFound && (
        <div className="px-2">
          <NoPanelsFound dashboardOption={ctx.dashboardOption} />
        </div>
      )}
      {ctx.panelsLoading && (
        <div className="relative h-32">
          <LoadingIndicator message="Loading sales data" />
        </div>
      )}
    </div>
  );
};

export default SalesMobile;
