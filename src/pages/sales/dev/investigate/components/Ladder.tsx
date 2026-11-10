// Hooks
import { useState } from "react";

// Utils
import { LADDER_SHOWN, money } from "../utils";
import { ladderSays } from "../utils/deptInvestigation";

// Interfaces
import type { PriceLadder, PricePoint } from "../interfaces";

// Components
import PriceChart from "./PriceChart";
import Rung from "./Rung";

interface LadderProps {
  ladder: PriceLadder;
  label: string;
  mine: boolean;
}

/** One store's price ladder, the first rungs shown and the rest behind a toggle. */
const Ladder = ({ ladder, label, mine }: LadderProps) => {
  const [all, setAll] = useState(false);

  if (ladder.points.length === 0) {
    return (
      <p className="flex items-center gap-2 text-[13px] text-content/95">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            mine ? "bg-store_open" : "bg-store_compare"
          }`}
        />
        <span className="font-semibold text-content">{label}</span>
        rang none of it this week.
      </p>
    );
  }

  /* Biggest first. The ladder was in price order, which puts the price that
     sold three units above the one that sold a hundred and thirty-five as
     often as not. */
  /*
     NOT pounds. These points carry no weight column — that absence is the
     whole reason the weighted flag exists — so `units` here is the number of
     times the item was SCANNED, and one scan of sirloin is whatever the
     package happened to weigh. Labelling it "lb" said a pound was sold and
     made a 1.7 lb ring read as 1 lb. The sentence above the ladder already
     counts these as rings; this agrees with it.
  */

  /* Biggest first, by what the rows actually print: on a scale item the
     price that moved the most POUNDS leads, not the one scanned most often. */
  const weightOf = (pt: PricePoint) =>
    ladder.weighted ? (pt.weight > 0 ? pt.weight : pt.units) : pt.units;
  const byUnits = [...ladder.points].sort((x, y) => weightOf(y) - weightOf(x));
  const shown = all ? byUnits : byUnits.slice(0, LADDER_SHOWN);
  const says = ladderSays(ladder);

  return (
    <div className="rounded-lg bg-custom-white shadow-card-sm px-3.5 py-3">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            mine ? "bg-store_open" : "bg-store_compare"
          }`}
        />
        <span className="min-w-0 truncate text-[13px] font-bold text-content">
          {label}
        </span>
        {ladder.promo && (
          <span className="flex-shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded bg-delta_positive_bg text-delta_positive_text">
            Promotion
          </span>
        )}
        {/* Where the Promotion chip would have been. A scale item rings a
            different total on every package, so the old chip fired on all of
            them — this says what the spread actually is. */}
        {ladder.weighted && (
          <span className="flex-shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text">
            By weight
          </span>
        )}
      </div>

      {says && (
        <p className="text-[12.5px] leading-snug text-content/95 mt-1.5">
          {says}
        </p>
      )}

      <div className="mt-2">
        <PriceChart points={ladder.points} weighed={ladder.weighted} />
      </div>

      <div className="mt-1">
        {shown.map((p) => (
          <Rung key={p.price} p={p} weighed={ladder.weighted} />
        ))}
      </div>

      {byUnits.length > LADDER_SHOWN && (
        <button
          onClick={() => setAll((v) => !v)}
          className="mt-1.5 text-[12px] font-bold text-brand_navy_hover hover:underline"
        >
          {all ? "Show fewer" : `Show all ${byUnits.length} prices`}
        </button>
      )}

      {/* The contrast that justifies the whole payload: on two prices the
          average is a figure nobody ever paid. */}
      {ladder.points.length > 1 && ladder.blended !== null && (
        <p className="mt-2 rounded-md bg-severity_watch_bg text-severity_watch_text px-2.5 py-1.5 text-[12px] leading-snug">
          An average would call it{" "}
          <span className="font-bold tabular-nums">
            {money(ladder.blended)}
          </span>{" "}
          — a price no customer paid.
        </p>
      )}
    </div>
  );
};

export default Ladder;
