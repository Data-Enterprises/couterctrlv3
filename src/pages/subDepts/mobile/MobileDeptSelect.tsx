import { useAppDispatch } from "../../../hooks";
import { useParams, useSubMarginCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import { formatSubDate } from ".";
import { getSubMargins } from "../../../api/subMargins";

import { useSubMarginActions } from "../hooks/useSubMarginActions";

import type {
  SubMarginsJsonResp,
  SubDeptMargin,
  JsonError,
} from "../../../interfaces";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import {
  BuildingStorefrontIcon,
  CalendarIcon,
} from "@heroicons/react/24/solid";

const MobileDeptSelect = () => {
  const ctx = useSubMarginCtx();
  const params = useParams();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();

  const getData = (week: number, id: number) => {
    const subs = [...ctx.subDepts];
    dispatch(actions.requerySubDeptMargins());
    dispatch(actions.setSelectedSubDeptId(id));
    dispatch(actions.setSubDepts(subs));
    dispatch(actions.setLoadingMargins(true));

    // For mobile, just wanting to look at week 1
    dispatch(actions.setSelectedWeek(1));
    getSubMargins(
      ctx.url,
      ctx.token,
      id,
      params.start,
      params.end,
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
                id,
                params.start,
                params.end,
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
                      dispatch(actions.setWeekTrendMargins({ data: marginData, week }));
                      dispatch(actions.setProcessMobileItemData(true));
                    }
                  }
                })
                .catch((err: JsonError) => toast.error(err.message));
            }
          } else {
            // If we only have one page of data total, we can just set the margins for the week
            dispatch(actions.setWeekTrendMargins({ data: marginData, week }));
            dispatch(actions.setProcessMobileItemData(true));
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  if (!ctx.loadingSubDepts && !ctx.subDepts.length) return null;

  if (ctx.loadingSubDepts) {
    return (
      <div className="relative w-full h-[calc(100vh-257px)]">
        <LoadingIndicator message="Loading Sub Depts" className="" />
      </div>
    );
  }

  return (
    <div className="text-[13px] font-medium">
      <div className="mt-2 mx-2 px-2 text-[13.5px] font-medium grid grid-cols-[2fr_1fr]">
        <div className="flex gap-2 items-center">
          <CalendarIcon className="w-6 h-6 text-blue-500" />
          {formatSubDate(params.start)} - {formatSubDate(params.end)}
        </div>
        <div className="flex gap-2 items-center justify-end">
          <BuildingStorefrontIcon className="w-6 h-6 text-blue-500" />
          <div>{ctx.subDepts.length} Sub Depts</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-2 pb-2 mt-2 max-h-[calc(100vh-290px)] overflow-y-auto">
        {ctx.subDepts.map((s, i) => (
          <div
            key={i}
            className="p-2 bg-custom-white rounded-full shadow-md text-[13px] flex justify-between items-center"
            onClick={() => getData(1, s.id)}
          >
            <div className="font-medium text-center w-full">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileDeptSelect;
