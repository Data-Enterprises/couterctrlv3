import { useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { coverBreakdown, fmtLb, shrinkLabel } from ".";
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
  const onOrder = item.on_order_weight ?? 0;
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
          <div className="text-[11px] text-custom-white/85">
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

      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-content/85">
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
          <div className="px-3 pb-1 text-[11px] text-content/85 leading-snug">
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
        {onOrder > 0 && (
          <Row k="Already on order" v={`− ${fmtLb(onOrder)} lb`} soft />
        )}
      </div>

      <div className="border-t-2 border-content/70 bg-gray-50">
        <Row k="Order" v={`${fmtLb(item.suggested_weight)} lb`} strong />
      </div>

      <div className="px-3 py-2 border-t border-gray-100 text-[11px] leading-snug text-content/85">
        {item.shrink_clamped
          ? "This item's waste rate hit its limit and was capped — that is usually an item received under one code and sold under another, not heavy waste."
          : "A forecast of what will sell, with waste added. It does not subtract what is already in the case."}
      </div>
    </div>
  );
};

export default WorkingPopover;
