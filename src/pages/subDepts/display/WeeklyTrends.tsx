import { useSubMarginCtx, useParams } from "../hooks";
import { useAppDispatch } from "../../../hooks";
import {
  resetAllMargins,
  setLoadedMargins,
  setMargins,
  setSelectedWeek,
  setWeekTrendMargins,
  type MarginWeek,
} from "../../../features/subMarginSlice";
// import WeekCard from "./WeekCard";
import { setDates } from "..";
import type {
  JsonError,
  SubDeptMargin,
  SubMarginsJsonResp,
} from "../../../interfaces";
import { getSubMargins } from "../../../api/subMargins";
import { useToast } from "../../../components/toasts/hooks/useToast";

const WeeklyTrends = () => {
  const toast = useToast();
  const ctx = useSubMarginCtx();
  const params = useParams();
  const dispatch = useAppDispatch();

  const handleWeekClick = (week: MarginWeek) => {
    let needsFetch = true;
    let data: SubDeptMargin[] = [];
    if (week === 1 && ctx.weekOneMargins.length) {
      data = ctx.weekOneMargins;
      needsFetch = false;
    } else if (week === 2 && ctx.weekTwoMargins.length) {
      data = ctx.weekTwoMargins;
      needsFetch = false;
    } else if (week === 3 && ctx.weekThreeMargins.length) {
      data = ctx.weekThreeMargins;
      needsFetch = false;
    } else if (week === 4 && ctx.weekFourMargins.length) {
      data = ctx.weekFourMargins;
      needsFetch = false;
    }

    if (!needsFetch) {
      // If we already have the data for the week, we can just set it as the selected week to display
      dispatch(setSelectedWeek(week));
      dispatch(setMargins(data))
      return;
    }

    dispatch(resetAllMargins());
    dispatch(setSelectedWeek(week));

    let end = "";
    let start = "";

    switch (week) {
      case 1:
        end = params.end;
        start = params.start;
        break;
      case 2:
        end = setDates(new Date(params.end), 7);
        start = setDates(new Date(params.end), 13);
        break;

      case 3:
        end = setDates(new Date(params.end), 14);
        start = setDates(new Date(params.end), 20);
        break;
      case 4:
        end = setDates(new Date(params.end), 21);
        start = setDates(new Date(params.end), 27);
        break;
    }
    getData(start, end, week);
  };

  const getData = (start: string, end: string, week: number) => {
    // Initial data fetch for the designated trend week
    getSubMargins(
      ctx.url,
      ctx.token,
      ctx.selectedSubDeptId,
      start,
      end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
    )
      .then((resp) => {
        const j: SubMarginsJsonResp = resp.data;
        if (j.error === 0) {
          let marginData: SubDeptMargin[] = j.subs;

          // We have the margins, now we need to sort them into their respective weeks based on the date
          if (j.total_pages > 1) {
            // Setting up a check array since checking the linear calls can cause timing bugs
            // Therefore when al the pages in this array have fetched === true, we know all pages have been fetched
            // Then we set the redux slice with the complete data for the week
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) {
              pages.push({ page, fetched: false });
            }
            // Iterating through the remaining pages => then appending the data to the initial marginData
            for (let page = 2; page <= j.total_pages; page++) {
              getSubMargins(
                ctx.url,
                ctx.token,
                ctx.selectedSubDeptId,
                start,
                end,
                params.useGroups,
                params.searchValue,
                params.singleStore,
                page,
              )
                .then((resp) => {
                  const j: SubMarginsJsonResp = resp.data;
                  if (j.error === 0) {
                    // appending the new data to the existing marginData for the week
                    marginData = [...marginData, ...j.subs];

                    // Now that the data for the current page is fetched, we can mark it as such
                    pages.find((p) => p.page === page)!.fetched = true;

                    // If all pages have been fetched, we can set the margins for the week
                    if (pages.every((p) => p.fetched)) {
                      dispatch(setWeekTrendMargins({ data: marginData, week }));

                      // Once we've appended the final page of data to the week's margin data
                      // we mark this week as loaded in redux and wait for the others before loading the display
                      dispatch(setLoadedMargins({ week, loaded: true }));
                    }
                  }
                })
                .catch((err: JsonError) => toast.error(err.message));
            }
          } else {
            // If we only have one page of data total, we can just set the margins for the week
            dispatch(setWeekTrendMargins({ data: marginData, week }));
            dispatch(setLoadedMargins({ week, loaded: true }));
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="flex flex-col min-w-[10vw] gap-2 text-sm font-medium select-none bg-custom-white rounded-lg shadow-lg p-2">
      <div
        className={`${ctx.selectedWeek === 1 ? "btn-themeGreen" : "btn-themeBlue"} text-center`}
        onClick={() => handleWeekClick(1)}
      >
        Week 1
      </div>
      <div
        className={`${ctx.selectedWeek === 2 ? "btn-themeGreen" : "btn-themeBlue"} text-center`}
        onClick={() => handleWeekClick(2)}
      >
        Week 2
      </div>
      <div
        className={`${ctx.selectedWeek === 3 ? "btn-themeGreen" : "btn-themeBlue"} text-center`}
        onClick={() => handleWeekClick(3)}
      >
        Week 3
      </div>
      <div
        className={`${ctx.selectedWeek === 4 ? "btn-themeGreen" : "btn-themeBlue"} text-center`}
        onClick={() => handleWeekClick(4)}
      >
        Week 4
      </div>
    </div>
  );
};

export default WeeklyTrends;
