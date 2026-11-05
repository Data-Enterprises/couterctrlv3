// Hooks
import { useAppDispatch } from "../../../../../hooks";
import { useEventPerfCtx } from "../hooks";

// Redux
import {
  openEventDetail,
  toggleEventCard,
  toggleEventDay,
} from "../../../../../features/dev/devEventPerfSlice";

// Interfaces
import type { buildGroupRows } from "../utils";

// Components
import MobilePerfCard from "../../../../../components-dev/mobile/MobilePerfCard";
import PairedBars from "../../../../../components-dev/mobile/perf/PairedBars";
import PerfDelta from "../../../../../components-dev/mobile/perf/PerfDelta";
import EventStoreReport from "./EventStoreReport";

interface EventStoreCardProps {
  r: ReturnType<typeof buildGroupRows>[number];
  measure: "transactions" | "amount";
}

/** One store in the list: its change against the prior average and its
 *  bars; open, its own report. */
const EventStoreCard = ({ r, measure }: EventStoreCardProps) => {
  const dispatch = useAppDispatch();
  const {
    perf,
    fmt,
    listMax,
    storeTotals,
    days,
    shownCard,
    heroCaption,
    dayLabel,
    storeBusiest,
  } = useEventPerfCtx();
  const isOpen = perf.selectedStoreKey === r.key;
  return (
    <MobilePerfCard
      label={r.label}
      change={
        // The week against its baseline, signed, rather than
        // the week's own figure — which the WK bar directly
        // below already states, so the slot was spending the
        // card's most prominent corner saying it twice.
        //
        // A difference, not a percentage: this page measures
        // coupon dollars and exception counts, where a store
        // going 1 to 3 is not a bigger move than one going 20
        // to 30.
        // That is the same rule the "vs Avg" sort orders on.
        //
        // No baseline means nothing to difference against —
        // LP's baseline knows stores but never people — so
        // those rows keep showing their own figure.
        r.baseline === null ? (
          fmt(measure === "amount" ? r.amount : r.transactions)
        ) : (
          <PerfDelta
            ty={
              measure === "amount" ? r.amount : r.transactions
            }
            ly={r.baseline}
            format={fmt}
            className="!text-[12px] !font-semibold"
          />
        )
      }
      open={isOpen}
      minimised={!isOpen && perf.selectedStoreKey !== null}
      onToggle={() =>
        dispatch(
          toggleEventCard({ key: r.key, label: r.label }),
        )
      }
      bars={
        <PairedBars
          ty={measure === "amount" ? r.amount : r.transactions}
          ly={r.baseline ?? 0}
          max={listMax}
          labels={["WK", "AVG"]}
          format={fmt}
          compact
        />
      }
    >
      {isOpen && storeTotals && (
        <EventStoreReport
          days={days}
          selectedDay={shownCard.day}
          onToggleDay={(iso) => dispatch(toggleEventDay(iso))}
          totals={storeTotals}
          measure={measure}
          heroCaption={heroCaption}
          dayLabel={dayLabel}
          busiest={storeBusiest ?? "—"}
          onViewDetails={() => dispatch(openEventDetail(true))}
        />
      )}
    </MobilePerfCard>
  );
};

export default EventStoreCard;
