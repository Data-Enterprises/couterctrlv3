import { useAppDispatch } from "../../../hooks";
import { useParams, useSubMarginCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setLoadingMargins,
  setSelectedSubDeptId,
  setSubDeptFilterText,
  setWeekTrendMargins,
} from "../../../features/subMarginSlice";
import type { JsonError, SubMarginsJsonResp } from "../../../interfaces";
import { setDates } from "..";

import { getSubMargins } from "../../../api/subMargins";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import Input from "../../../components/inputs/Input";

const SubDepts = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useSubMarginCtx();
  const params = useParams();

  const filteredSubDepts = ctx.subDepts.filter((sub) =>
    sub.desc.toLowerCase().includes(ctx.subDeptFitlerText.toLowerCase()),
  );

  const handleFilterTextChange = (x: string) => {
    dispatch(setSubDeptFilterText(x));
  };

  const getData = (id: number, start: string, end: string, week: number) => {
    getSubMargins(
      ctx.url,
      ctx.token,
      id,
      start,
      end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
    )
      .then((resp) => {
        const j: SubMarginsJsonResp = resp.data;
        if (j.error === 0) {
          // We have the margins, now we need to sort them into their respective weeks based on the date
          dispatch(setWeekTrendMargins({ data: j.subs, week }));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleSubDeptClick = (id: number) => {
    dispatch(setLoadingMargins(true));
    dispatch(setSelectedSubDeptId(id));

    // Get the margins => start with week 1 margins by default
    getData(id, params.start, params.end, 1);

    // Weeks 2, 3, and 4 => need new start/end dates
    const wk2End = setDates(new Date(params.end), 7);
    const wk2Start = setDates(new Date(params.end), 13);
    getData(id, wk2Start, wk2End, 2);

    const wk3End = setDates(new Date(params.end), 14);
    const wk3Start = setDates(new Date(params.end), 20);
    getData(id, wk3Start, wk3End, 3);

    const wk4End = setDates(new Date(params.end), 21);
    const wk4Start = setDates(new Date(params.end), 27);
    getData(id, wk4Start, wk4End, 4);
  };

  return (
    <div className="flex flex-col gap-2 relative">
      {ctx.subDepts.length ? (
        <Input
          label="Sub Dept"
          value={ctx.subDeptFitlerText}
          setValue={handleFilterTextChange}
        />
      ) : null}
      {/* If sub depts have been fetched */}
      {ctx.subDepts.length ? (
        <div className="grid grid-cols-2 gap-2 max-h-[51.5vh] overflow-hidden overflow-y-auto no-scrollbar">
          {filteredSubDepts.map((sub) => (
            <div
              key={sub.id}
              className={`${ctx.selectedSubDeptId === sub.id ? "bg-orange-200" : "bg-custom-white"} p-2 rounded-lg shadow-lg text-sm text-center hover:bg-blue-200 cursor-pointer transition-all duration-200`}
              onClick={() => handleSubDeptClick(sub.id)}
            >
              {sub.desc}
            </div>
          ))}
        </div>
      ) : // Are we loading the data?
      ctx.loadingSubDepts ? (
        <LoadingIndicator message="Loading sub depts..." className="mt-44" />
      ) : // Data is not being loaded and there are no sub depts fetched => render nothing
      null}
    </div>
  );
};

export default SubDepts;
