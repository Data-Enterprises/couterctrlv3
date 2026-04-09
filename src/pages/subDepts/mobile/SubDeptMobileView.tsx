import { useAppDispatch } from "../../../hooks";
import { useSubMarginCtx, useParams } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  requerySubDeptMargins,
  setLoadingSubDepts,
  setSearchValue,
  setSubDepts,
} from "../../../features/subMarginSlice";
import { getSubDepts } from "../../../api/subMargins";
import type { JsonError, SubDept, SubSalesJsonResp } from "../../../interfaces";

import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import SingleSelect from "../../../components/SingleSelect";
import MobileDeptSelect from "./MobileDeptSelect";
import MobileDeptDataView from "./MobileDeptDataView";
import { useState } from "react";

const SubDeptMobileView = () => {
  const ctx = useSubMarginCtx();
  const params = useParams();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [warning, setWarning] = useState<boolean>(false);

  const handleStoreSelect = (id: string | number) => {
    if (warning) setWarning(false);
    dispatch(setSearchValue(Number(id)));
  };

  const handleSubDeptSearch = () => {
    if (!params.searchValue) {
      setWarning(true);
      return;
    }
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

  const findStoreName = () => {
    const store = ctx.assignedStores.find((s) => s.storeid === ctx.searchValue);
    return store ? store.store_name : "";
  };

  if (ctx.selectedSubDeptId) return <MobileDeptDataView />;

  return (
    <div className="max-h-[calc(100vh-3rem)] min-h-[calc(100vh-3rem)] overflow-hidden">
      <div className="bg-custom-white m-2 p-2 rounded-lg shadow-lg h-[193px]">
        <SingleSelect
          label="Store"
          data={ctx.assignedStores}
          displayKey="store_name"
          valueKey="storeid"
          onSelect={handleStoreSelect}
          defaultQuery={`${ctx.searchValue > 0 ? findStoreName() : ""}`}
          innerClass="text-sm"
          listClass="text-sm"
        />
        <SingleDatePicker />
        <button
          className="btn-themeBlue px-0 w-full mt-2"
          onClick={handleSubDeptSearch}
        >
          Search
        </button>
      </div>
      <MobileDeptSelect warning={warning} />
    </div>
  );
};

export default SubDeptMobileView;
