import { useAppDispatch } from "../../hooks";
import { useSubMarginCtx } from "./hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { formatGoliathDate } from "../../utils";
import { getSubDepts, getSubMargins } from "../../api/subMargins";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import type { JsonError, SubDept, SubSalesJsonResp } from "../../interfaces";
import {
  setSelectedSubDeptId,
  setSubDeptFilterText,
  setSubDepts,
} from "../../features/subMarginSlice";

import Input from "../../components/inputs/Input";
import LoadingIndicator from "../../components/loading/LoadingIndicator";

const SubMarginControls = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useSubMarginCtx();

  const params = {
    start: formatGoliathDate(ctx.startDate),
    end: formatGoliathDate(ctx.endDate),
    // No matter what, useGroups and singleStore will always be the opposite of each other
    useGroups: ctx.type === "Group" ? 1 : 0,
    singleStore: ctx.type === "Store" ? 1 : 0,
    searchValue: ctx.type === "Group" ? ctx.lastGroup : ctx.lastStore,
  };

  const handleSubDeptSearch = () => {
    getSubDepts(
      ctx.url,
      ctx.token,
      params.start,
      params.end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
    )
      .then((resp) => {
        const j: SubSalesJsonResp = resp.data;
        if (j.error === 0) {
          const subDepts = j.subs
            .reduce((acc: SubDept[], curr) => {
              if (!acc.some((s) => s.id === curr.sub_department)) {
                acc.push({
                  id: curr.sub_department,
                  desc: curr.sub_department_description,
                });
              }
              return acc;
            }, [])
            .sort((a, b) => a.id - b.id);

          dispatch(setSubDepts(subDepts));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleFilterTextChange = (x: string) => {
    dispatch(setSubDeptFilterText(x));
  };

  const handleSubDeptClick = (id: number) => {
    dispatch(setSelectedSubDeptId(id));
    // Get the margins

  };

  const resetBtnActive = () => {
    if (ctx.selectedSubDeptId && ctx.margins.length) {
      return "";
    }
    return "opacity-50 pointer-events-none";
  };

  const exportBtnActive = () => {
    if (ctx.selectedSubDeptId && ctx.margins.length) {
      return "";
    }
    return "opacity-50 pointer-events-none";
  };

  const filteredSubDepts = ctx.subDepts.filter((sub) =>
    sub.desc.toLowerCase().includes(ctx.subDeptFitlerText.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="bg-custom-white p-2 rounded-lg shadow-lg">
        <StorePicker />
        <DatePickers handleQuery={handleSubDeptSearch} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className={`btn-themeBlue px-0 ${resetBtnActive()}`}>
            Reset
          </button>
          <button className={`btn-themeGreen px-0 ${exportBtnActive()}`}>
            Export
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Input
          label="Sub Dept"
          value={ctx.subDeptFitlerText}
          setValue={handleFilterTextChange}
        />
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
      </div>
    </div>
  );
};

export default SubMarginControls;
