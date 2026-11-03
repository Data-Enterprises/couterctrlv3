import RecapCard from "./RecapCard";
import { priceShares } from "./recapMix";
import { count, money, pct } from "./recapFormat";
import type { DayMixState } from "./recapTypes";

/**
 * Refunds, and how much of the day sold at regular price.
 *
 * The only block that waits on a read: the day's item rows, which carry the
 * sale type and price type nothing else in the panel has. A store that sends
 * no price type (Sonic sends none) gets an empty dashed bar and says so,
 * rather than a full one that would claim everything sold at regular.
 */
const RecapMixCard = ({ state }: { state: DayMixState }) => {
  if (state.status !== "ready") {
    return (
      <RecapCard title="Refunds and price mix">
        <div className="mt-2.5 text-[12px] text-content">
          {state.status === "error"
            ? "This day's items could not be read. Close the day and open it again to retry."
            : "Reading this day's items…"}
        </div>
      </RecapCard>
    );
  }
  const { mix } = state;
  const shares = priceShares(mix);
  return (
    <RecapCard title="Refunds and price mix">
      <div className="flex items-baseline gap-2 mt-2.5 text-content">
        <span className="text-[18px] font-bold tabular-nums">{count(mix.refunds.units)}</span>
        <span className="text-[13px]">
          {mix.refunds.units === 1 ? "unit" : "units"} refunded ·{" "}
          <b className="tabular-nums">{money(mix.refunds.net)}</b>
        </span>
      </div>
      <div className="mt-3 text-[12px] font-semibold text-content">Price mix</div>
      {shares ? (
        <>
          <div
            role="img"
            aria-label={`${pct(shares.regular)} of sales at regular price`}
            className="mt-1 h-3 rounded bg-bkg overflow-hidden"
          >
            <div className="h-full bg-brand_navy" style={{ width: `${shares.regular}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-[12px] text-content tabular-nums">
            <span>
              <b>{pct(shares.regular)}</b> regular
            </span>
            <span>
              <b>{pct(shares.promo)}</b> on sale / TPR
            </span>
          </div>
          {shares.unreported >= 1 && (
            <div className="mt-1 text-[11.5px] text-content">
              {pct(shares.unreported)} of sales carried no price type and are left out of the mix.
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-1 h-3 rounded border-[1.5px] border-dashed border-row_selected_border" />
          <div className="mt-1.5 text-[12px] leading-snug text-content">
            <b>Not reported.</b> This store sends no price type, so the mix is left blank
            rather than shown as all regular.
          </div>
        </>
      )}
    </RecapCard>
  );
};

export default RecapMixCard;
