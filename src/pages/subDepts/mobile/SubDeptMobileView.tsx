import { useAppDispatch } from "../../../hooks";
import { useSubMarginCtx, useParams } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useSubMarginActions } from "../hooks/useSubMarginActions";
import { getSubDepts } from "../../../api/subMargins";
import type { JsonError, SubSalesJsonResp } from "../../../interfaces";
import { distinctSubDepts } from "..";

import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import SingleSelect from "../../../components/SingleSelect";
import MobileDeptSelect from "./MobileDeptSelect";
import MobileDeptDataView from "./MobileDeptDataView";

const SubDeptMobileView = () => {
  const ctx = useSubMarginCtx();
  const params = useParams();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();

  const handleStoreSelect = (id: string | number) => {
    dispatch(actions.setSearchValue(Number(id)));
  };

  const handleSubDeptSearch = () => {
    if (!params.searchValue) {
      toast.warn("Please select a store");
      return;
    }
    dispatch(actions.requerySubDeptMargins());
    dispatch(actions.setLoadingSubDepts(true));
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
          // Keyed on the id, or the description where the company doesn't
          // number its departments — see utils/subDeptIdentity.
          const subDepts = distinctSubDepts(j.subs);

          dispatch(actions.setSubDepts(subDepts));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setLoadingSubDepts(false)));
  };

  const findStoreName = () => {
    const store = ctx.assignedStores.find((s) => s.storeid === ctx.searchValue);
    return store ? store.store_name : "";
  };

  if (ctx.selectedSubDeptKey != null) return <MobileDeptDataView />;

  return (
    <div className="max-h-[calc(100vh-3rem)] min-h-[calc(100vh-3rem)] overflow-hidden">
      <div className="bg-custom-white m-2 p-2 rounded-lg shadow-lg h-[182px]">
        <SingleSelect
          label="Store"
          data={ctx.assignedStores}
          displayKey="store_name"
          valueKey="storeid"
          onSelect={handleStoreSelect}
          defaultQuery={`${ctx.searchValue > 0 ? findStoreName() : ""}`}
          innerClass="text-[13px]"
          listClass="text-[13px]"
        />
        <SingleDatePicker />
        <button
          className="btn-themeBlue px-0 w-full mt-2 text-[13px] py-1"
          onClick={handleSubDeptSearch}
        >
          Search
        </button>
      </div>
      <MobileDeptSelect />
    </div>
  );
};

export default SubDeptMobileView;
