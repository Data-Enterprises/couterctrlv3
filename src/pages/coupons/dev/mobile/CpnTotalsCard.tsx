import { formatCurrency2 } from "../../../../utils";
import { sumCouponAmount } from "../../../../utils/couponValue";
import type { CouponItem } from "../../../../interfaces";

interface Props {
  coupons: CouponItem[];
  /** What the figures are OF, on the line above the headline. */
  caption: string;
}

/**
 * The coupon figures for whatever is in scope.
 *
 * One component rather than the identical four-column strip the store list,
 * the overview and the section detail each carried their own copy of — three
 * places to change a figure, and three chances to change two of them.
 *
 * Value takes the headline and the other three become tiles. The strip gave
 * all four equal weight, which is a layout with no opinion: this is the
 * Coupons page, coupon value is what it is about, and a count of products is
 * context for that number rather than a peer of it.
 *
 * Totals are summed through `sumCouponAmount`, never a running add — the
 * transaction-level fallback has to be deduped first. See utils/couponValue.
 */
const CpnTotalsCard = ({ coupons, caption }: Props) => {
  const total = sumCouponAmount(coupons);
  const avg = coupons.length > 0 ? total / coupons.length : 0;
  const products = new Set(coupons.map((c) => c.product_code)).size;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white px-3.5 pb-3 pt-2.5 shadow-md">
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
            <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/95">
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
