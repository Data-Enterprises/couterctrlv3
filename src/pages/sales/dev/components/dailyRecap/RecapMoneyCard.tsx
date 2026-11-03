import { BanknotesIcon } from "@heroicons/react/24/outline";
import RecapCard from "./RecapCard";
import { money } from "./recapFormat";
import type { RecapMoney } from "./recapTypes";

/** A plain line of the sum: label left, figure right, a hairline under it. */
const line = (label: string, value: string, short: boolean, rule = true) => (
  <div
    key={label}
    className={`flex justify-between gap-3 px-4 ${short ? "py-1.5" : "py-2"} ${
      rule ? "border-b border-gray-100" : ""
    }`}
  >
    <span className="min-w-0 truncate">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

/**
 * The day's money as a sum: with tax, less tax, is net sales.
 *
 * Net sales is the day card's figure, on its own tinted band under the rule
 * so the answer stands out from the working. No coupon line: the POS has
 * already taken coupons out of these sales, and the coupon columns repeat
 * that money, so a coupon total here would be counted twice. Fuel, lottery
 * and cash are out of net, as on the day cards, and named so their money is
 * not lost.
 */
const RecapMoneyCard = ({ money: m, short }: { money: RecapMoney; short: boolean }) => (
  <RecapCard title="Money" icon={BanknotesIcon} compact={short} bodyClassName="flex flex-col pt-1">
    <div className="flex flex-col flex-1 text-[13.5px] text-content tabular-nums">
      {line("Sales with tax", money(m.withTax), short)}
      {line("− Tax", money(m.tax), short, false)}
      <div
        className={`flex items-baseline justify-between gap-3 mx-2.5 px-2 ${
          short ? "py-1.5" : "py-2.5"
        } border-t-[1.5px] border-content bg-bkg/50 rounded-b-md`}
      >
        <span className="text-[14.5px] font-bold">= Net sales</span>
        <span className={`${short ? "text-[17px]" : "text-[19px]"} font-bold`}>{money(m.net)}</span>
      </div>
      <div className="mt-auto pt-1">
        {m.leftOut.length === 0
          ? line("Left out of net", "None here", short, false)
          : m.leftOut.map((l, i) =>
              line(`Left out: ${l.name}`, money(l.net), short, i < m.leftOut.length - 1),
            )}
      </div>
    </div>
  </RecapCard>
);

export default RecapMoneyCard;
