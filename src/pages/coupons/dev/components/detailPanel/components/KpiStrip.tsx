// Utils
import { formatCurrency2 } from "../../../../../../utils";

interface KpiStripProps {
  totalCoupons: number;
  totalAmount: number;
  avgPerCoupon: number;
  uniqueProducts: number;
  uniqueSubDepts: number;
  vendorCount: number;
}

/** The six totals for everything in scope. */
const KpiStrip = ({
  totalCoupons,
  totalAmount,
  avgPerCoupon,
  uniqueProducts,
  uniqueSubDepts,
  vendorCount,
}: KpiStripProps) => (
    <div data-help="kpis" className="grid grid-cols-6 divide-x divide-brand_navy/15 border-b border-brand_navy/15 bg-gray-50 flex-shrink-0">
      {[
        { label: "Coupons", value: String(totalCoupons) },
        { label: "Total amt", value: formatCurrency2(totalAmount) },
        { label: "Avg / coupon", value: formatCurrency2(avgPerCoupon) },
        { label: "Products", value: String(uniqueProducts) },
        { label: "Sub depts", value: String(uniqueSubDepts) },
        { label: "Vendor", value: String(vendorCount) },
      ].map(({ label, value }) => (
        <div key={label} className="px-4 py-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            {label}
          </div>
          <div className="text-[14px] font-bold text-content">{value}</div>
        </div>
      ))}
    </div>
);

export default KpiStrip;
