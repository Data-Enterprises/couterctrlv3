import { useSubMarginCtx, useParams } from "../hooks";
import { useAppDispatch } from "../../../hooks";
import {
  setLoadingMargins,
  setSelectedWeek,
  setWeekTrendMargins,
  type MarginWeek,
} from "../../../features/subMarginSlice";

import { setDates } from "..";
import type {
  JsonError,
  SubDeptMargin,
  SubMarginsJsonResp,
} from "../../../interfaces";
import { getSubMargins } from "../../../api/subMargins";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { formatDate } from "./widgets";

const WeeklyTrends = () => {
  const toast = useToast();
  const ctx = useSubMarginCtx();
  const params = useParams();
  const dispatch = useAppDispatch();

  const handleWeekClick = (week: MarginWeek) => {
    dispatch(setLoadingMargins(true));
    dispatch(setSelectedWeek(week));

    // Starting pointfor the dates
    let end = params.end;
    let start = params.start;

    if (week === 1 && !ctx.weekOneMargins.length) {
      getData(start, end, week);
    }

    if (week === 2 && !ctx.weekTwoMargins.length) {
      end = setDates(new Date(params.end), 7);
      start = setDates(new Date(params.end), 13);
      getData(start, end, week);
    }

    if (week === 3 && !ctx.weekThreeMargins.length) {
      end = setDates(new Date(params.end), 14);
      start = setDates(new Date(params.end), 20);
      getData(start, end, week);
    }

    if (week === 4 && !ctx.weekFourMargins.length) {
      end = setDates(new Date(params.end), 21);
      start = setDates(new Date(params.end), 27);
      getData(start, end, week);
    }

    if (week === 5) {
      if (!ctx.weekOneMargins.length) {
        getData(start, end, 1);
      }

      if (!ctx.weekTwoMargins.length) {
        const wk2End = setDates(new Date(params.end), 7);
        const wk2Start = setDates(new Date(params.end), 13);
        getData(wk2Start, wk2End, 2);
      }

      if (!ctx.weekThreeMargins.length) {
        const wk3End = setDates(new Date(params.end), 14);
        const wk3Start = setDates(new Date(params.end), 20);
        getData(wk3Start, wk3End, 3);
      }

      if (!ctx.weekFourMargins.length) {
        const wk4End = setDates(new Date(params.end), 21);
        const wk4Start = setDates(new Date(params.end), 27);
        getData(wk4Start, wk4End, 4);
      }
    }
  };

  const getData = (start: string, end: string, week: number) => {
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
                    }
                  }
                })
                .catch((err: JsonError) => toast.error(err.message));
            }
          } else {
            // If we only have one page of data total, we can just set the margins for the week
            dispatch(setWeekTrendMargins({ data: marginData, week }));
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const showWeekRange = (week: number) => {
    const end = setDates(new Date(ctx.singleDate), 0);
    const start = setDates(new Date(ctx.singleDate), 6);
    let wkStart = "",
      wkEnd = "";

    switch (week) {
      case 1:
        return `${formatDate(start)} - ${formatDate(end)}`;
      case 2:
        wkEnd = setDates(new Date(ctx.singleDate), 7);
        wkStart = setDates(new Date(ctx.singleDate), 13);
        return `${formatDate(wkStart)} - ${formatDate(wkEnd)}`;
      case 3:
        wkEnd = setDates(new Date(ctx.singleDate), 14);
        wkStart = setDates(new Date(ctx.singleDate), 20);
        return `${formatDate(wkStart)} - ${formatDate(wkEnd)}`;
      case 4:
        wkEnd = setDates(new Date(ctx.singleDate), 21);
        wkStart = setDates(new Date(ctx.singleDate), 27);
        return `${formatDate(wkStart)} - ${formatDate(wkEnd)}`;
      case 5:
        return "All Weeks";
    }
  };

  return (
    <div
      className={`${ctx.subDepts.length > 0 ? "" : "opacity-50 pointer-events-none"} grid gap-2 text-sm font-medium select-none bg-custom-white rounded-lg shadow-lg p-2`}
    >
      <div
        className={`${ctx.selectedWeek === 1 ? "btn-themeGreen" : "btn-themeBlue"} text-center py-1.5`}
        onClick={() => handleWeekClick(1)}
      >
        {showWeekRange(1)}
      </div>
      <div
        className={`${ctx.selectedWeek === 2 ? "btn-themeGreen" : "btn-themeBlue"} text-center py-1.5`}
        onClick={() => handleWeekClick(2)}
      >
        {showWeekRange(2)}
      </div>
      <div
        className={`${ctx.selectedWeek === 3 ? "btn-themeGreen" : "btn-themeBlue"} text-center py-1.5`}
        onClick={() => handleWeekClick(3)}
      >
        {showWeekRange(3)}
      </div>
      <div
        className={`${ctx.selectedWeek === 4 ? "btn-themeGreen" : "btn-themeBlue"} text-center py-1.5`}
        onClick={() => handleWeekClick(4)}
      >
        {showWeekRange(4)}
      </div>
      <div
        className={`${ctx.selectedWeek === 5 ? "btn-themeGreen" : "btn-themeBlue"} text-center py-1.5`}
        onClick={() => handleWeekClick(5)}
      >
        {showWeekRange(5)}
      </div>
    </div>
  );
};

export default WeeklyTrends;
