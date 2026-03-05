import { useRef, useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useParams, useSubMarginCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getSubDepts } from "../../../api/subMargins";

import type { JsonError, SubDept, SubSalesJsonResp } from "../../../interfaces";
import {
  requerySubDeptMargins,
  setLoadingSubDepts,
  setOpenExportModal,
  setSearchValue,
  setSubDepts,
} from "../../../features/subMarginSlice";

import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import SubDepts from "./SubDepts";
import WeeklyTrends from "../display/WeeklyTrends";
import SingleSelect from "../../../components/SingleSelect";

const useHeight = () => {
  const [height, setHeight] = useState<string>("max-h-[31vh]");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;

        if (containerHeight > 842) {
          setHeight("max-h-[31vh]");
        } else {
          setHeight("max-h-[22vh]");
        }
      }
    };

    handleHeight();

    window.addEventListener("resize", handleHeight);

    return () => {
      window.removeEventListener("resize", handleHeight);
    };
  }, []);

  return { containerRef, height };
};

const SubMarginControls = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useSubMarginCtx();
  const params = useParams();
  const { containerRef, height } = useHeight();

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

  const handleStoreSelect = (id: string | number) => {
    dispatch(setSearchValue(Number(id)));
  };

  const findStoreName = () => {
    const store = ctx.assignedStores.find((s) => s.storeid === ctx.searchValue);
    return store ? store.store_name : "";
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1">
      <div className="bg-custom-white p-2 rounded-lg shadow-lg">
        <SingleSelect
          label="Store"
          data={ctx.assignedStores}
          displayKey="store_name"
          valueKey="storeid"
          onSelect={handleStoreSelect}
          defaultQuery={`${ctx.searchValue > 0 ? findStoreName() : ""}`}
        />
        <SingleDatePicker />
        <button
          className="btn-themeBlue px-0 w-full mt-2"
          onClick={handleSubDeptSearch}
        >
          Search
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            className={`btn-themeBlue px-0 ${resetBtnActive()}`}
            onClick={() => dispatch(requerySubDeptMargins())}
          >
            Reset
          </button>
          <button
            className={`btn-themeGreen px-0 ${exportBtnActive()}`}
            onClick={() => dispatch(setOpenExportModal(true))}
          >
            Export
          </button>
        </div>
      </div>
      <SubDepts height={height} />
      {ctx.selectedSubDeptId > 0 && <WeeklyTrends />}
    </div>
  );
};

export default SubMarginControls;
