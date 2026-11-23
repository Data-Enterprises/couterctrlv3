// Utils
import { money } from "../utils/recapFormat";

// Interfaces
import type { DayMixState, RecapMoney } from "../interfaces/index";

// Components
import RecapPriceMix from "./RecapPriceMix";
import RecapStatCard from "./RecapStatCard";

interface RecapMoneyCardProps {
  money: RecapMoney;
  mix: DayMixState;
  short: boolean;
}

/**
 * The day's money: net sales first (the day card's figure), then the sum
 * behind it (sales with tax, less tax), then the price mix splitting it.
 * Fuel, lottery and cash are not listed: the day card's net already leaves
 * them out, and the card says what the net is, not what it is not.
 *
 * No coupon line: the POS has already taken coupons out of these sales, and
 * the coupon columns repeat that money, so a coupon total would count twice.
 */
const RecapMoneyCard = ({ money: m, mix, short }: RecapMoneyCardProps) => (
  <RecapStatCard
    title="Money"
    hero={money(m.net)}
    heroSub="net sales"
    short={short}
    rows={[
      { label: "Sales with tax", value: money(m.withTax) },
      { label: "− Tax", value: money(m.tax) },
    ]}
  >
    <RecapPriceMix state={mix} short={short} />
  </RecapStatCard>
);

export default RecapMoneyCard;
