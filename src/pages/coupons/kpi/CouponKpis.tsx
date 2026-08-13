import { useAppSelector } from "../../../hooks";
import {
  CurrencyDollarIcon,
  HashtagIcon,
  UsersIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/solid";
import { formatCurrency2 } from "../../../utils";
import { sumCouponAmount } from "../../../utils/couponValue";
import { subDeptKeyMode, subDeptKeyOf } from "../../../utils/subDeptIdentity";

const CouponKpis = () => {
  const { gridCoupons } = useAppSelector((state) => state.couponLegacy);
  const { isTablet } = useAppSelector((state) => state.app);

  const totalCoupons = gridCoupons.length;
  const totalAmount = sumCouponAmount(gridCoupons);
  const avgCpnAmount = totalCoupons > 0 ? totalAmount / totalCoupons : 0;
  const customerIdCount = new Set(
    gridCoupons.filter((c) => c.customer_id).map((c) => c.customer_id)
  ).size;
  // Distinct departments, keyed the way the rest of the page groups them —
  // counting raw ids reports 1 at a company that doesn't number its
  // departments, since every row carries 0. See utils/subDeptIdentity.
  const subDeptMode = subDeptKeyMode(gridCoupons);
  const subDeptCount = new Set(
    gridCoupons.map((c) => subDeptKeyOf(c, subDeptMode)),
  ).size;

  const kpiStyle =
    "bg-custom-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center font-medium relative";

  return (
    <div className="grid grid-cols-5 gap-4 cursor-default select-none text-sm">
      <div className={kpiStyle}>
        <HashtagIcon
          height={38}
          width={38}
          className={`${isTablet ? "hidden" : "absolute left-4"}`}
          fill="#3b82f6"
        />
        <div className="text-content/60">Total Coupons</div>
        <div className="text-[13.5px]">{totalCoupons}</div>
      </div>
      <div className={kpiStyle}>
        <CurrencyDollarIcon
          height={38}
          width={38}
          className={`${isTablet ? "hidden" : "absolute left-4"} absolute left-4`}
          fill="#3b82f6"
        />
        <div className="text-content/60">Total Amount</div>
        <div className="text-[13.5px]">{formatCurrency2(totalAmount)}</div>
      </div>
      <div className={kpiStyle}>
        <CurrencyDollarIcon
          height={38}
          width={38}
          className={`${isTablet ? "hidden" : "absolute left-4"} absolute left-4`}
          fill="#3b82f6"
        />
        <div className="text-content/60">Avg Amount</div>
        <div className="text-[13.5px]">{formatCurrency2(avgCpnAmount)}</div>
      </div>
      <div className={kpiStyle}>
        <UsersIcon
          height={38}
          width={38}
          className={`${isTablet ? "hidden" : "absolute left-4"} absolute left-4`}
          fill="#3b82f6"
        />
        <div className="text-content/60">Customers</div>
        <div className="text-[13.5px]">{customerIdCount}</div>
      </div>
      <div className={kpiStyle}>
        <ShoppingBagIcon
          height={38}
          width={38}
          className={`${isTablet ? "hidden" : "absolute left-4"} absolute left-4`}
          fill="#3b82f6"
        />
        <div className="text-content/60">Sub Depts</div>
        <div className="text-[13.5px]">{subDeptCount}</div>
      </div>
    </div>
  );
};

export default CouponKpis;
