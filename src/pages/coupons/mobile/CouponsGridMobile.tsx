import { useCouponContext } from "..";
import Modal from "../../../components/Modal";
import SingleSelect from "../../../components/SingleSelect";
import {
  resetCoupons,
  setGridCoupons,
  setShowSubsMobileFilter,
  setSubDeptMobileFilter,
  setUniqueDateMobileFilter,
} from "../../../features/couponSlice";
import { useAppDispatch } from "../../../hooks";
import TransactionModal from "../../lossPrevention/TransactionModal";
import CpnCard from "./CpnCard";

const CouponsGridMobile = () => {
  const ctx = useCouponContext();
  const dispatch = useAppDispatch();

  const handleFilter = () => {
    const dateFilter = new Date(ctx.uniqueDateMobileFilter).getTime();

    // if there is no date selected, then dateFilter will be "Invalid Date" and we want to ignore the date filtering in that case
    const filtered = ctx.coupons.filter((c) => {
      const dateCheck =
        dateFilter.toString() !== "Invalid Date"
          ? new Date(c.sale_date).getTime() === dateFilter
          : true;
      const subDeptCheck = ctx.subDeptMobileFilter.length
        ? ctx.subDeptMobileFilter.includes(c.sub_department_description)
        : true;
      return dateCheck && subDeptCheck;
    });

    dispatch(setGridCoupons(filtered));
    dispatch(setShowSubsMobileFilter(false));
  };

  const handleDateSelect = (value: string | number) => {
    const dateFilter = new Date(value);

    // If All Dates option is selected, then dateFilter will be "Invalid Date" and we want to ignore the date filtering in that case
    const filtered = ctx.coupons.filter((c) => {
      const dateCheck =
        dateFilter.toString() !== "Invalid Date"
          ? new Date(c.sale_date).getTime() === dateFilter.getTime()
          : true;
      const subDeptCheck = ctx.subDeptMobileFilter.length
        ? ctx.subDeptMobileFilter.includes(c.sub_department_description)
        : true;
      return dateCheck && subDeptCheck;
    });

    dispatch(setGridCoupons(filtered));
    dispatch(setUniqueDateMobileFilter(value as string));
  };

  const handleDeselectAll = () => {
    dispatch(setSubDeptMobileFilter(""));
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <TransactionModal />
      <div className="p-2">
        <button
          className="btn-themeBlue w-full"
          onClick={() => dispatch(resetCoupons())}
        >
          Refresh
        </button>
      </div>
      <div className="px-2 space-y-2">
        <SingleSelect
          label="Date"
          data={ctx.uniqueCpnDates}
          valueKey="value"
          displayKey="label"
          onSelect={handleDateSelect}
        />
        <Modal
          isOpen={ctx.showSubsMobileFilter}
          onClose={() => dispatch(setShowSubsMobileFilter(false))}
          className="-ml-12 px-2"
        >
          <div className="grid grid-cols-3 gap-2 text-[13px] max-h-[75vh] overflow-y-auto">
            {ctx.uniqueSubDepts.map((sd, i) => (
              <div
                key={i}
                className={`py-1 rounded-full shadow-md text-center ${ctx.subDeptMobileFilter.includes(sd) ? "bg-orange-200" : "bg-custom-white"} transition-all duration-200`}
                onClick={() => dispatch(setSubDeptMobileFilter(sd))}
              >
                {sd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              className="btn-themeGreen px-0 py-1.5"
              onClick={handleFilter}
            >
              Filter
            </button>
            <button
              className="btn-themeOrange px-0 py-1.5"
              onClick={handleDeselectAll}
            >
              Deselect All
            </button>
          </div>
          <div className="text-[13px] text-center text-content/60 mt-2">
            <div>If none are selected</div>
            <div>it will show all sub departments</div>
          </div>
        </Modal>
        {ctx.showSubsMobileFilter ? null : (
          <div>
            <button
              className="btn-themeBlue px-0 w-full"
              onClick={() => dispatch(setShowSubsMobileFilter(true))}
            >
              Sub Depts
            </button>
          </div>
        )}
      </div>
      <div className="p-2 space-y-2 max-h-[calc(100vh-14.5rem)] overflow-y-auto text-sm">
        {ctx.gridCoupons.map((c, i) => (
          <CpnCard key={i} c={c} />
        ))}
      </div>
    </div>
  );
};

export default CouponsGridMobile;
