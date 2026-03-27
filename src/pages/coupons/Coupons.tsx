import { useState } from "react";
import { useAppDispatch } from "../../hooks";
import { getCoupons } from "../../api/coupons";
import { useToast } from "../../components/toasts/hooks/useToast";
import { useCouponContext, cols } from ".";
import {
  resetCoupons,
  setIsFetching,
  setNoCouponsFound,
} from "../../features/couponSlice";
import type { CouponsResponse, JsonError } from "../../interfaces";
import { setCoupons } from "../../features/couponSlice";
import { formatGoliathDate } from "../../utils";

// components
import StorePicker from "../../components/storePicker/StorePicker";
import DatePickers from "../../components/datePickers/DatePickers";
import CouponsGrid from "./CouponsGrid";
import CouponGridFilters from "./CouponGridFilters";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import TransactionModal from "../lossPrevention/TransactionModal";
import FiltersModal from "./filters/FiltersModal";
import ExportModal from "../../components/modals/ExportModal";
import CouponKpis from "./kpi/CouponKpis";

const Coupons = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useCouponContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const getData = () => {
    dispatch(setCoupons([]));
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
      searchValue,
    )
      .then((resp) => {
        const j: CouponsResponse = resp.data;
        if (j.error === 0 && j.records.length > 0) {
          dispatch(setCoupons(j.records));
        } else {
          dispatch(setNoCouponsFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetching(false)));
  };

  const showGrid = context.coupons.length > 0 && !context.isFetching;
  const showLoading = context.coupons.length === 0 && context.isFetching;
  const noCoupons = context.noCouponsFound;

  return (
    <div className="w-full h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <TransactionModal />
      <FiltersModal />
      <ExportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        data={context.gridCoupons}
        columns={cols}
      />
      <div className="grid grid-cols-[17%_auto] p-4 gap-4 w-full h-full">
        <div>
          <div className="bg-custom-white p-2 rounded-lg shadow-lg">
            <StorePicker />
            <DatePickers handleQuery={getData} />
            <div className="flex gap-2 mt-2">
              <button
                data-testid="coupons-refresh-btn"
                className={`${
                  context.coupons.length === 0 &&
                  "opacity-50 pointer-events-none"
                } btn-themeOrange w-full px-0`}
                onClick={() => dispatch(resetCoupons())}
              >
                Refresh
              </button>
              <button
                data-testid="coupons-export-btn"
                className={`${
                  context.coupons.length === 0 &&
                  "opacity-50 pointer-events-none"
                } btn-themeGreen w-full px-0`}
                onClick={() => setIsOpen(true)}
              >
                Export
              </button>
            </div>
          </div>
          {showGrid && <CouponGridFilters />}
        </div>

        {showGrid && (
          <div className="space-y-4">
            <CouponKpis />
            <CouponsGrid />
          </div>
        )}

        {noCoupons && (
          <div
            data-testid="no-coupons"
            className="h-full flex items-center justify-center bg-custom-white rounded-lg shadow-lg"
          >
            No coupons found
          </div>
        )}

        {showLoading && (
          <div className="w-full h-full relative">
            <LoadingIndicator message="Loading coupons..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons;
