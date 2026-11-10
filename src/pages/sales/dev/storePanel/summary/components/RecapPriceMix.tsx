// Utils
import { priceShares } from "../utils/recapMix";
import { money0, pct } from "../utils/recapFormat";

// Interfaces
import type { DayMixState } from "../interfaces/index";

interface RecapPriceMixProps {
  state: DayMixState;
  short: boolean;
}

/**
 * The day's net sales split by price type, under Money's lines: one slim bar,
 * navy for regular and the light line tone for on sale, with the dollars on
 * each side ("$5,279 reg", "$4,874 sale") behind a swatch of its colour. A
 * measure, not a grade.
 *
 * Read from the day's item rows, so it waits on them. A store that sends no
 * price type gets an empty dashed bar marked not reported, never a full one
 * that would claim everything sold at regular.
 */
const RecapPriceMix = ({ state, short }: RecapPriceMixProps) => {
  const gap = short ? "mt-2" : "mt-3";
  if (state.status !== "ready") {
    return (
      <div className={`${gap} text-[13px] text-content`}>
        {state.status === "error" ? "Price mix could not be read" : "Reading the price mix…"}
      </div>
    );
  }
  const shares = priceShares(state.mix);
  if (!shares) {
    return (
      <div className={gap}>
        <div className="h-2 rounded border border-dashed border-row_selected_border" />
        <div className="mt-1.5 text-[13px] text-content">Price mix not reported</div>
      </div>
    );
  }
  return (
    <div className={gap}>
      <div
        role="img"
        aria-label={`${pct(shares.regular)} of net sales at regular price, ${pct(shares.promo)} on sale or TPR`}
        className="flex gap-0.5 h-2 rounded overflow-hidden"
      >
        {shares.regular > 0 && (
          <span className="bg-brand_navy" style={{ flex: `${shares.regular} 0 0` }} />
        )}
        {shares.promo > 0 && (
          <span className="bg-brand_line_2" style={{ flex: `${shares.promo} 0 0` }} />
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-x-3 mt-1.5 text-[13px] text-content tabular-nums">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand_navy" aria-hidden="true" />
          <span className="font-semibold">{money0(state.mix.regular)}</span> reg
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand_line_2" aria-hidden="true" />
          <span className="font-semibold">{money0(state.mix.promo)}</span> sale
        </span>
      </div>
    </div>
  );
};

export default RecapPriceMix;
