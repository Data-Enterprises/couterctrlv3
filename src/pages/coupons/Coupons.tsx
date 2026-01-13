import { useAppDispatch } from "../../hooks";
import { getCoupons } from "../../api/coupons";
import { useToast } from "../../components/toasts/hooks/useToast";
import { useCouponContext } from ".";
import { setIsFetching } from "../../features/couponSlice";

// components
import StorePicker from "../../components/storePicker/StorePicker";
import DatePickers from "../../components/datePickers/DatePickers";
import type { CouponsResponse, JsonError } from "../../interfaces";
import { setCoupons } from "../../features/couponSlice";
import { formatGoliathDate } from "../../utils";
import CouponsGrid from "./CouponsGrid";
import CouponGridFilters from "./CouponGridFilters";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import TransactionModal from "../cashiers/TransactionModal";
import FiltersModal from "./filters/FiltersModal";

const Coupons = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useCouponContext();

  const getData = () => {
    dispatch(setIsFetching(true));
    const useGroups = context.type === "Group" ? 1 : 0;
    const singleStore = context.type === "Store" ? 1 : 0;
    const searchValue =
      context.type === "Group" ? context.lastGroup : context.lastStore;
    const start = formatGoliathDate(context.startDate);
    const end = formatGoliathDate(context.endDate);

    getCoupons(
      context.url,
      context.token,
      start,
      end,
      useGroups,
      singleStore,
      searchValue
    )
      .then((resp) => {
        const j: CouponsResponse = resp.data;
        if (j.error === 0) {
          dispatch(setCoupons(j.records));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetching(false)));
  };

  const showGrid = context.coupons.length > 0 && !context.isFetching;
  const showLoading = context.coupons.length === 0 && context.isFetching;

  return (
    <div className="w-full h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <TransactionModal />
      <FiltersModal />
      <div className="grid grid-cols-[20%_auto] p-4 gap-4 w-full h-full">
        <div>
          <div className="bg-custom-white p-4 rounded-lg shadow-lg">
            <StorePicker />
            <DatePickers handleQuery={getData} />
          </div>
          {showGrid && <CouponGridFilters />}
        </div>
        {showGrid && <CouponsGrid />}

        {showLoading && (
          <div className="w-full h-full relative">
            <LoadingIndicator message="Loading coupons..." />
          </div>
        ) }
      </div>
    </div>
  );
};

export default Coupons;
