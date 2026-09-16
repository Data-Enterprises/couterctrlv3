import { useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { coverBreakdown, fmtLb, shrinkLabel, ACTION_TONE, SCOPE_TEXT } from ".";
import type { SuggestedAction } from ".";
import type { DowRates, SuggestedItem } from "../../interfaces";

/**
 * How this row's number was arrived at, for this row.
 *
 * The help modal explains the model in general; it cannot show a waste rate,
 * because that is per item. This is the same explanation with the reader's own
 * figures in it: the days their settings picked, the rate this item does on
 * each of those weekdays, and the uplift its own waste history earns.
 *
 * It reports the endpoint's numbers rather than recomputing them. The days are
 * a decomposition, not a second opinion — the moment the panel starts deriving
 * its own suggested weight, a rounding difference reads as the model being
 * wrong.
 */
interface Props {
  x: number;
  y: number;
  item: SuggestedItem;
  coverWindow: { start: string; end: string } | null;
  /** Straight off `parameters`, so the header states the settings that produced
   *  these days rather than whatever is in the form right now. */
  leadDays: number;
  coverDays: number;
  /** The row's one suggested action, if it has one. */
  action: SuggestedAction | null;
  onClose: () => void;
}

const Row = ({
  k,
  v,
  strong,
  soft,
}: {
  k: string;
  v: string;
  strong?: boolean;
  soft?: boolean;
}) => (
  <div className="flex items-baseline justify-between gap-6 px-3 py-1.5">
    <span
      className={`text-[12px] ${strong ? "font-semibold text-content" : soft ? "text-content/85" : "text-content"}`}
    >
      {k}
    </span>
    <span
      className={`text-[12px] tabular-nums ${
        strong ? "font-bold text-[#1e2a4a] text-[13px]" : "text-content"
      }`}
    >
      {v}
    </span>
  </div>
);

const WorkingPopover = ({
  x,
  y,
  item,
  coverWindow,
  leadDays,
  coverDays,
  action,
  onClose,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const days = coverBreakdown(item.dow_rates as DowRates | undefined, coverWindow);
  const daySum = days.reduce((s, d) => s + d.lb, 0);
  const demand = item.demand_weight ?? 0;
  const mult = item.shrink_multiplier ?? 1;
  const onHand = item.on_hand_weight ?? 0;
  const uplift = demand * mult - demand;

  // Rounding, not disagreement: dow_rates and demand_weight are each rounded to
  // 2dp server-side, so the parts need not add to the whole.
  const drift = Math.abs(daySum - demand) >= 0.02;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: Math.min(y, window.innerHeight - 430),
        left: Math.min(x, window.innerWidth - 340),
        zIndex: 9999,
      }}
      className="w-[320px] bg-custom-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
    >
      <div
        className="px-3 py-2 flex items-start justify-between gap-2"
        style={{ background: "#1e2a4a" }}
      >
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-custom-white truncate">
            {item.product_description ?? String(item.product_code)}
          </div>
          <div className="text-[12px] text-custom-white/85">
            {leadDays} days until delivery · {coverDays} cover days
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-custom-white/85 hover:text-custom-white flex-shrink-0"
          title="Close"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pt-2 pb-1 text-[12px] font-semibold uppercase tracking-wide text-content/85">
        What this item does on the days covered
      </div>
      {days.length === 0 ? (
        <div className="px-3 pb-2 text-[12px] text-content/85">
          No cover window on this response.
        </div>
      ) : (
        days.map((d) => <Row key={d.iso} k={d.label} v={`${fmtLb(d.lb)} lb`} soft />)
      )}

      <div className="border-t border-gray-200">
        <Row k="Cover demand" v={`${fmtLb(demand)} lb`} />
        {drift && (
          <div className="px-3 pb-1 text-[12px] text-content/85 leading-snug">
            The days above sum to {fmtLb(daySum)} — each weekday rate is rounded
            to two places before it is shown, so the parts need not add to the
            whole.
          </div>
        )}
        <Row
          k={`Waste ${shrinkLabel(item)}${
            item.shrink_source === "none" ? "" : ` · ${item.shrink_source}`
          }`}
          v={uplift > 0 ? `+ ${fmtLb(uplift)} lb` : "—"}
          soft
        />
        {onHand > 0 && (
          <>
            <Row k="Already in the case" v={`− ${fmtLb(onHand)} lb`} soft />
            {/* The subtraction, shown rather than asserted. This is the one
                term of the model a buyer will not take on trust — "48 lb
                already in the case" is a claim about their own case, and they
                will want to know where it came from before they cut an order
                by it. Both halves are the SHORT window, which is why the line
                names the days. */}
            <div className="px-3 pb-1.5 text-[12px] text-content/85 leading-snug">
              Ordered {fmtLb(item.ordered_weight_recent)} lb and sold{" "}
              {fmtLb(item.sold_weight_recent)} lb over the last{" "}
              {leadDays + coverDays} days.
            </div>
          </>
        )}
        {/* The same stock expressed as time, because that is the form every
            rhythm action is argued in. Pounds say what came off this order;
            days say whether it is a lot. */}
        {item.days_of_cover != null && (
          <Row
            k="That is days of stock"
            v={`${
              item.days_of_cover < 10
                ? item.days_of_cover.toFixed(1)
                : Math.round(item.days_of_cover)
            } of ${leadDays + coverDays}`}
            soft
          />
        )}
      </div>

      <div className="border-t-2 border-content/70 bg-gray-50">
        <Row k="Order" v={`${fmtLb(item.suggested_weight)} lb`} strong />
      </div>

      {action && (
        <div className="px-3 py-2.5 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[12px] font-semibold ${ACTION_TONE[action.tone].chip}`}
            >
              {action.label}
            </span>
            {/* Says which kind of advice this is. Without it "over-ordering"
                next to a figure of 313 lb reads as "buy less than 313", which
                is the one thing it does not mean. */}
            <span className="text-[12px] text-content/85">
              {SCOPE_TEXT[action.scope]}
            </span>
          </div>
          <p className="text-[12px] leading-snug text-content">{action.detail}</p>
        </div>
      )}

      <div className="px-3 py-2 border-t border-gray-100 text-[12px] leading-snug text-content/85">
        {onHand > 0
          ? "What this item should sell over those days, plus its waste rate, less what is still in the case."
          : "What this item should sell over those days, plus its waste rate. Nothing came off for stock on hand — more has sold than was recorded as ordered, so there is nothing to net."}
      </div>
    </div>
  );
};

export default WorkingPopover;
