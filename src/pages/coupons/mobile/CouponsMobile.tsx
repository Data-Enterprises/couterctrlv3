import { formatDate } from ".";
import { useCouponContext } from "..";
import { getCoupons } from "../../../api/coupons";
import DatePickers from "../../../components/datePickers/DatePickers";
import StorePicker from "../../../components/storePicker/StorePicker";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useAppDispatch } from "../../../hooks";
import { useCouponActions } from "../hooks/useCouponActions";
import type { CouponsResponse, JsonError } from "../../../interfaces";
import { formatGoliathDate } from "../../../utils";
import CouponsGridMobile from "./CouponsGridMobile";

const CouponsMobile = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useCouponContext();
  const actions = useCouponActions();
  const getData = () => {
    dispatch(actions.setCoupons([]));
    dispatch(actions.setIsFetching(true));
    const useGroups = ctx.type === "Group" ? 1 : 0;
    const singleStore = ctx.type === "Store" ? 1 : 0;
    const searchValue = ctx.type === "Group" ? ctx.lastGroup : ctx.lastStore;
    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);

    getCoupons(
      ctx.url,
      ctx.token,
      start,
      end,
      useGroups,
      singleStore,
      searchValue,
    )
      .then((resp) => {
        const j: CouponsResponse = resp.data;
        if (j.error === 0 && j.records.length > 0) {
          dispatch(actions.setCoupons(j.records));
          dispatch(actions.setCouponMobileStage(1));
          const uniqueDates = Array.from(
            new Set(j.records.map((r) => r.sale_date)),
          )
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            .map((d) => ({ label: formatDate(d), value: d }));

          const uniqueSubDepts = Array.from(
            new Set(j.records.map((r) => r.sub_department_description)),
          ).sort((a, b) => a.localeCompare(b));

          // Replace with dispatch actions to help filter the coupons
          dispatch(actions.setUniqueCpnDates(uniqueDates));
          dispatch(actions.setUniqueSubDepts(uniqueSubDepts));
        } else {
          dispatch(actions.setNoCouponsFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setIsFetching(false)));
  };

  if (ctx.couponMobileStage === 1) return <CouponsGridMobile />;

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <div className="m-2 p-2 bg-custom-white rounded-lg shadow-lg">
        <StorePicker />
        <DatePickers handleQuery={getData} btnPadding="py-1" />
      </div>
      {ctx.noCouponsFound ? (
        <div className="bg-orange-200 m-2 p-4 rounded-lg shadow-lg">
          <div className="font-medium text-center">No Coupons Found</div>
          <div className="text-sm text-center mt-1">
            Please select a different date range for your store(s)
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CouponsMobile;
