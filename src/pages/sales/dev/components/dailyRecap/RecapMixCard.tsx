import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import RecapCard from "./RecapCard";
import { priceShares } from "./recapMix";
import { count, money, pct } from "./recapFormat";
import type { DayMixState } from "./recapTypes";

const TITLE = "Refunds and price mix";

/**
 * Refunds, and how much of the day sold at regular price.
 *
 * Refunds sit in their own tinted box. The mix is one stacked bar, each part
 * labelled with its share, and a legend under it: navy for regular, the light
 * line tone for on sale. A measure, not a grade. A store that sends no price
 * type (Sonic sends none) gets an empty dashed bar and says so, rather than a
 * full one that would claim everything sold at regular.
 *
 * The only block that waits on a read: the day's item rows, which carry the
 * sale type and price type nothing else in the panel has.
 */
const RecapMixCard = ({ state, short }: { state: DayMixState; short: boolean }) => {
  if (state.status !== "ready") {
    return (
      <RecapCard title={TITLE} icon={ArrowUturnLeftIcon} compact={short}>
        <div className="text-[12.5px] text-content">
          {state.status === "error"
            ? "This day's items could not be read. Pick All week, then this day again, to retry."
            : "Reading this day's items…"}
        </div>
      </RecapCard>
    );
  }
  const { mix } = state;
  const shares = priceShares(mix);
  return (
    <RecapCard title={TITLE} icon={ArrowUturnLeftIcon} compact={short}>
      <div
        className={`flex flex-wrap items-baseline gap-2.5 rounded-lg border border-brand_line bg-bkg/30 px-3 ${
          short ? "py-1.5" : "py-2.5"
        } text-content`}
      >
        <span className={`${short ? "text-[18px]" : "text-[21px]"} font-bold tabular-nums`}>
          {count(mix.refunds.units)}
        </span>
        <span className="text-[13px]">
          {mix.refunds.units === 1 ? "unit" : "units"} refunded ·{" "}
          <b className="tabular-nums">{money(mix.refunds.net)}</b>
        </span>
      </div>
      <div
        className={`${short ? "mt-2" : "mt-3.5"} text-[11px] font-bold uppercase tracking-wide text-content`}
      >
        Price mix · share of net sales
      </div>
      {shares ? (
        <>
          <div
            role="img"
            aria-label={`${pct(shares.regular)} of net sales at regular price, ${pct(shares.promo)} on sale or TPR`}
            className={`flex gap-0.5 ${short ? "h-[22px] mt-1.5" : "h-[26px] mt-2"} rounded-md overflow-hidden`}
          >
            {shares.regular > 0 && (
              <span
                className="flex items-center pl-2 bg-brand_navy text-custom-white text-[12px] font-bold tabular-nums overflow-hidden"
                style={{ flex: `${shares.regular} 0 0` }}
              >
                {shares.regular >= 12 ? pct(shares.regular) : ""}
              </span>
            )}
            {shares.promo > 0 && (
              <span
                className="flex items-center justify-end pr-2 bg-brand_line_2 text-content text-[12px] font-bold tabular-nums overflow-hidden"
                style={{ flex: `${shares.promo} 0 0` }}
              >
                {shares.promo >= 12 ? pct(shares.promo) : ""}
              </span>
            )}
          </div>
          <div className="flex justify-between gap-3 mt-1.5 text-[12.5px] text-content tabular-nums">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand_navy" aria-hidden="true" />
              Regular {pct(shares.regular)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand_line_2" aria-hidden="true" />
              On sale / TPR {pct(shares.promo)}
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
          <div
            className={`${short ? "h-[22px] mt-1.5" : "h-[26px] mt-2"} rounded-md border-[1.5px] border-dashed border-row_selected_border`}
          />
          <div className="mt-1.5 text-[12.5px] leading-snug text-content">
            <b>Not reported.</b> This store sends no price type, so the mix is left blank
            rather than shown as all regular.
          </div>
        </>
      )}
    </RecapCard>
  );
};

export default RecapMixCard;
