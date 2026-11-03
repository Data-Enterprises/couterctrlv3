import { useLayoutEffect, useRef, useState } from "react";
import { avgBasket } from "./recapDays";
import { count, hourRange, money, one } from "./recapFormat";
import type { RecapHour } from "./recapTypes";

/** How far the card sits from the cursor, and from the screen's edges. */
const GAP = 14;
const EDGE = 8;

/**
 * The readout for one hour of the day's chart, following the mouse.
 *
 * Drawn fixed to the viewport so nothing clips it, and kept on screen: it sits
 * below and right of the cursor, flips left near the right edge and up near
 * the bottom, measured after it renders so it fits whatever the panel's size
 * or the browser's zoom. It never takes the pointer, so moving across the bars
 * is not interrupted.
 *
 * The hour's own figures, and its share of the day. No grade: a busy hour is
 * a fact, not a verdict.
 */
const RecapHourTip = ({
  hour,
  dayNet,
  x,
  y,
}: {
  hour: RecapHour;
  /** The day's net sales by hour, summed: the base for the hour's share. */
  dayNet: number;
  x: number;
  y: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + GAP, top: y + GAP });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const right = x + GAP + width > window.innerWidth - EDGE;
    const below = y + GAP + height > window.innerHeight - EDGE;
    setPos({
      left: Math.max(EDGE, right ? x - GAP - width : x + GAP),
      top: Math.max(EDGE, below ? y - GAP - height : y + GAP),
    });
  }, [x, y]);

  const basket = avgBasket(hour.net, hour.transactions);
  const rows: [string, string][] = [
    ["Net sales", money(hour.net)],
    ["Share of the day", dayNet > 0 ? `${one((hour.net / dayNet) * 100)}%` : "—"],
    ["Transactions", hour.transactions > 0 ? count(hour.transactions) : "—"],
    ["Avg basket", basket === null ? "—" : money(basket)],
    ["Qty", count(hour.qty)],
  ];

  return (
    <div
      ref={ref}
      role="tooltip"
      className="fixed z-50 pointer-events-none rounded border border-gray-200 bg-custom-white shadow-lg px-2.5 py-2 min-w-[168px]"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="text-[12px] font-bold text-content mb-1 whitespace-nowrap">
        {hourRange(hour.hour)}
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 whitespace-nowrap">
          <span className="text-[11.5px] text-content">{label}</span>
          <span className="text-[11.5px] font-semibold text-content tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
};

export default RecapHourTip;
