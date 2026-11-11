// Utils
import { formatCurrency2 } from "../../../../utils";
import { sumCouponAmount } from "../../../../utils/couponValue";

// Interfaces
import type { CouponItem } from "../../../../interfaces";

interface CpnTotalsCardProps {
  coupons: CouponItem[];
  /** What the figures are OF, on the line above the headline. */
  caption: string;
}

/**
 * The coupon figures for whatever is in scope: value as the headline, the
 * other three as tiles. Totals go through `sumCouponAmount`, never a running
 * add, so the transaction-level fallback is deduped (see utils/couponValue).
 */
const CpnTotalsCard = ({ coupons, caption }: CpnTotalsCardProps) => {
  const total = sumCouponAmount(coupons);
  const avg = coupons.length > 0 ? total / coupons.length : 0;
  const products = new Set(coupons.map((c) => c.product_code)).size;

  return (
    <section className="overflow-hidden rounded-2xl border border-line_field bg-custom-white px-3.5 pb-3 pt-2.5 shadow-md">
      <div className="text-[12px] text-content/95">{caption}</div>
      <div className="font-display text-[30px] font-extrabold leading-none tracking-tight text-content">
        {formatCurrency2(total)}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2.5 border-t border-brand_line pt-2.5">
        {(
          [
            ["Coupons", coupons.length.toLocaleString("en-US")],
            ["Avg", formatCurrency2(avg)],
            ["Products", products.toLocaleString("en-US")],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="flex flex-col items-center text-center">
            <span className="cc-caps-mono text-[9.5px]">
              {k}
            </span>
            <span className="font-display text-[15px] font-bold tabular-nums text-content">
              {v}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CpnTotalsCard;
