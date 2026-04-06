import { useCouponContext } from "..";
import SingleSelect from "../../../components/SingleSelect";
import { resetCoupons } from "../../../features/couponSlice";
import { useAppDispatch } from "../../../hooks";

const CouponsGridMobile = () => {
  const ctx = useCouponContext();
  const dispatch = useAppDispatch();
  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
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
        />
        <div className="grid grid-cols-3 gap-2 text-[13px]">
          {ctx.uniqueSubDepts.map((sd, i) => (
            <div key={i} className="bg-custom-white py-1 rounded-full shadow-md text-center">
              {sd}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CouponsGridMobile;
