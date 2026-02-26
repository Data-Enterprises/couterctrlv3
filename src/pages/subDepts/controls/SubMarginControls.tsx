import { useAppDispatch } from "../../../hooks";
import { useParams, useSubMarginCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getSubDepts } from "../../../api/subMargins";

import DatePickers from "../../../components/datePickers/DatePickers";
import StorePicker from "../../../components/storePicker/StorePicker";
import type { JsonError, SubDept, SubSalesJsonResp } from "../../../interfaces";
import {
  requerySubDeptMargins,
  setLoadingSubDepts,
  setSubDepts,
} from "../../../features/subMarginSlice";

import SubDepts from "./SubDepts";

const SubMarginControls = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useSubMarginCtx();
  const params = useParams();

  const handleSubDeptSearch = () => {
    dispatch(requerySubDeptMargins());
    dispatch(setLoadingSubDepts(true));
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
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setLoadingSubDepts(false)));
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
      <SubDepts />
    </div>
  );
};

export default SubMarginControls;
