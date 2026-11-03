import RecapCard from "./RecapCard";
import { money } from "./recapFormat";
import type { RecapMoney } from "./recapTypes";

/**
 * The day's money as a sum: with tax, less tax, is net sales.
 *
 * Net sales is the day card's figure. No coupon line: the POS has already
 * taken coupons out of these sales, and the coupon columns repeat that money,
 * so a coupon total here would be counted twice. Fuel, lottery and cash are
 * out of net, as on the day cards, and named so their money is not lost.
 */
const RecapMoneyCard = ({ money: m }: { money: RecapMoney }) => (
  <RecapCard title="Money">
    <div className="grid grid-cols-[1fr_auto] gap-x-2.5 gap-y-1.5 mt-2.5 text-[13px] text-content tabular-nums">
      <span>Sales with tax</span>
      <span className="text-right font-semibold">{money(m.withTax)}</span>
      <span>− Tax</span>
      <span className="text-right font-semibold">{money(m.tax)}</span>
      <span className="pt-1.5 border-t border-content text-[14px] font-bold">= Net sales</span>
      <span className="pt-1.5 border-t border-content text-right text-[14px] font-bold">
        {money(m.net)}
      </span>
      {m.leftOut.length === 0 ? (
        <>
          <span>Left out of net</span>
          <span className="text-right">None here</span>
        </>
      ) : (
        m.leftOut.map((l) => (
          <span key={l.name} className="contents">
            <span>Left out: {l.name}</span>
            <span className="text-right font-semibold">{money(l.net)}</span>
          </span>
        ))
      )}
    </div>
  </RecapCard>
);

export default RecapMoneyCard;
