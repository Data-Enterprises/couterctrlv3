// Utils
import { count, EVENT_CLASS } from "../utils";

// Interfaces
import type { SupplyEvent } from "../interfaces";

interface EventTimelineProps {
  events: SupplyEvent[];
  ready: boolean;
  tint: string;
  label: string;
}

/** One store's orders and deliveries in date order, or why there are none. */
const EventTimeline = ({ events, ready, tint, label }: EventTimelineProps) => (
  <div className="min-w-0">
    <div
      className={`text-[13px] cc-caps pb-1.5 border-b-2 leading-tight ${tint}`}
    >
      {label}
    </div>

    {events.length === 0 ? (
      <p className="text-[12px] text-content/95 leading-relaxed pt-2.5">
        {ready ? (
          <>
            Nothing ordered and nothing received in the window.{" "}
            <span className="font-semibold">That is the finding</span>, not a
            gap in the data.
          </>
        ) : (
          "Still reading deliveries…"
        )}
      </p>
    ) : (
      events.map((e, i) => (
        <div
          key={`${e.date}__${e.kind}__${i}`}
          className="py-2 border-b border-brand_navy/15 last:border-b-0"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide text-brand_slate w-[52px] flex-shrink-0">
              {e.date.slice(5)}
            </span>
            <span
              className={`text-[12px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${EVENT_CLASS[e.kind]}`}
            >
              {e.kind}
            </span>
            <span className="ml-auto text-[12.5px] font-semibold tabular-nums text-content">
              {count(e.amount)} {e.unit}
            </span>
          </div>
          {e.detail && (
            <div
              className="text-[13px] text-content/95 mt-1 ml-[60px] truncate"
              title={e.detail}
            >
              {e.detail}
            </div>
          )}
        </div>
      ))
    )}
  </div>
);

export default EventTimeline;
