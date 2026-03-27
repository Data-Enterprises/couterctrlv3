import { useAppSelector } from "../../../hooks";
import {
  CurrencyDollarIcon,
  HashtagIcon,
  UsersIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/solid";
import { formatCurrency2 } from "../../../utils";

const CouponKpis = () => {
  const { gridCoupons } = useAppSelector((state) => state.coupons);

  const totalCoupons = gridCoupons.length;
  const totalAmount = gridCoupons.reduce((sum, c) => sum + c.coupon_amount, 0);
  const avgCpnAmount = totalCoupons > 0 ? totalAmount / totalCoupons : 0;
  const customerIdCount = new Set(
    gridCoupons.filter((c) => c.customer_id).map((c) => c.customer_id)
  ).size;
  const subDeptCount = new Set(gridCoupons.map((c) => c.sub_department)).size;

  const kpiStyle =
    "bg-custom-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center font-medium relative";

  return (
    <div className="grid grid-cols-5 gap-4">
      <div className={kpiStyle}>
        <HashtagIcon
          height={42}
          width={42}
          className="absolute left-5"
          fill="#3b82f6"
        />
        <div>Total Coupons</div>
        <div>{totalCoupons}</div>
      </div>
      <div className={kpiStyle}>
        <CurrencyDollarIcon
          height={42}
          width={42}
          className="absolute left-5"
          fill="#3b82f6"
        />
        <div>Total Amount</div>
        <div>{formatCurrency2(totalAmount)}</div>
      </div>
      <div className={kpiStyle}>
        <CurrencyDollarIcon
          height={42}
          width={42}
          className="absolute left-5"
          fill="#3b82f6"
        />
        <div>Avg Amount</div>
        <div>{formatCurrency2(avgCpnAmount)}</div>
      </div>
      <div className={kpiStyle}>
        <UsersIcon
          height={42}
          width={42}
          className="absolute left-5"
          fill="#3b82f6"
        />
        <div>Customers</div>
        <div>{customerIdCount}</div>
      </div>
      <div className={kpiStyle}>
        <ShoppingBagIcon
          height={42}
          width={42}
          className="absolute left-5"
          fill="#3b82f6"
        />
        <div>Sub Depts</div>
        <div>{subDeptCount}</div>
      </div>
    </div>
  );
};

export default CouponKpis;
