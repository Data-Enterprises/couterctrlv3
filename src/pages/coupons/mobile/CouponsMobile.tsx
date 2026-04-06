import { formatDate } from ".";
import { useCouponContext } from "..";
import { getCoupons } from "../../../api/coupons";
import DatePickers from "../../../components/datePickers/DatePickers";
import StorePicker from "../../../components/storePicker/StorePicker";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setCouponMobileStage,
  setCoupons,
  setIsFetching,
  setNoCouponsFound,
  setUniqueCpnDates,
  setUniqueSubDepts,
} from "../../../features/couponSlice";
import { useAppDispatch } from "../../../hooks";
import type { CouponsResponse, JsonError } from "../../../interfaces";
import { formatGoliathDate } from "../../../utils";
import TransactionModal from "../../lossPrevention/TransactionModal";
import CouponsGridMobile from "./CouponsGridMobile";

const CouponsMobile = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useCouponContext();
  const getData = () => {
    dispatch(setCoupons([]));
    dispatch(setIsFetching(true));
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
          dispatch(setCoupons(j.records));
          dispatch(setCouponMobileStage(1));
          const uniqueDates = Array.from(
            new Set(j.records.map((r) => r.sale_date)),
          )
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            .map((d) => ({ label: formatDate(d), value: d }));

          const uniqueSubDepts = Array.from(
            new Set(j.records.map((r) => r.sub_department_description)),
          ).sort((a, b) => a.localeCompare(b));

          // Replace with dispatch actions to help filter the coupons
          dispatch(setUniqueCpnDates(uniqueDates));
          dispatch(setUniqueSubDepts(uniqueSubDepts));
        } else {
          dispatch(setNoCouponsFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetching(false)));
  };

  if (ctx.couponMobileStage === 1) return <CouponsGridMobile />;

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <TransactionModal />
      <div className="m-2 p-2 bg-custom-white rounded-lg shadow-lg">
        <StorePicker />
        <DatePickers handleQuery={getData} />
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
