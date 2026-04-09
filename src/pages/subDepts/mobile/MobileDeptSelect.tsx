import { useAppDispatch } from "../../../hooks";
import { useParams, useSubMarginCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import { formatSubDate } from ".";
import { getSubMargins } from "../../../api/subMargins";

import {
  requerySubDeptMargins,
  setSelectedSubDeptId,
  setSubDepts,
  setLoadingMargins,
  setSelectedWeek,
  setWeekTrendMargins,
  setProcessMobileItemData,
} from "../../../features/subMarginSlice";

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

interface MobileDeptSelectProps {
  warning: boolean;
}

const MobileDeptSelect = ({ warning }: MobileDeptSelectProps) => {
  const ctx = useSubMarginCtx();
  const params = useParams();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const getData = (week: number, id: number) => {
    const subs = [...ctx.subDepts];
    dispatch(requerySubDeptMargins());
    dispatch(setSelectedSubDeptId(id));
    dispatch(setSubDepts(subs));
    dispatch(setLoadingMargins(true));

    // For mobile, just wanting to look at week 1
    dispatch(setSelectedWeek(1));
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
                      dispatch(setWeekTrendMargins({ data: marginData, week }));
                      dispatch(setProcessMobileItemData(true));
                    }
                  }
                })
                .catch((err: JsonError) => toast.error(err.message));
            }
          } else {
            // If we only have one page of data total, we can just set the margins for the week
            dispatch(setWeekTrendMargins({ data: marginData, week }));
            dispatch(setProcessMobileItemData(true));
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const storeName =
    ctx.assignedStores.find((s) => s.storeid === ctx.searchValue)?.store_name ||
    "";

  if (!ctx.searchValue && !ctx.loadingSubDepts) {
    return (
      <div className="bg-custom-white m-2 px-2 py-4 rounded-lg shadow-md text-[14px] text-center font-medium">
        <div className="flex gap-2 translate-x-[20%]">
          <BuildingStorefrontIcon className="w-6 h-6 text-blue-500" />
          <div className={`${warning ? "text-orange-500" : ""}`}>{warning ? "Please select a store" :storeName}</div>
        </div>
        <div className="flex gap-2 translate-x-[20%]">
          <CalendarIcon className="w-6 h-6 text-blue-500" />
          {formatSubDate(params.start)} - {formatSubDate(params.end)}
        </div>
        <div className="h-0.5 grid grid-cols-2 my-2">
          <div className="bg-gradient-to-r from-blue-200 to-custom-white h-full"></div>
          <div className="bg-gradient-to-l from-blue-200 to-custom-white h-full"></div>
        </div>
        <div>Press Search to view the selected store's</div>
        <div>sub departments in the date range</div>
      </div>
    );
  }

  if (ctx.loadingSubDepts) {
    return (
      <div className="relative w-full h-[calc(100vh-257px)]">
        <LoadingIndicator message="Loading Sub Depts" className="" />
      </div>
    );
  }

  return (
    <div className="text-[13px] font-medium">
      <div className="w-full px-2 text-[13.5px] flex justify-between items-center">
        <div>
          {formatSubDate(params.start)} - {formatSubDate(params.end)}
        </div>
        <div>{storeName}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-2 max-h-[calc(100vh-283px)] overflow-y-auto">
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
