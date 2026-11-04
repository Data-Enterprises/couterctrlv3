import { avgBasket } from "./recapDays";
import { count, hourRange, money, one } from "./recapFormat";
import type { RecapHour } from "./recapTypes";
import CursorTipBox from "../../../../../components-dev/tooltip/CursorTipBox";

/**
 * The readout for one hour of the day's chart, following the mouse.
 *
 * Drawn in the app's tooltip frame (CursorTipBox): fixed to the viewport,
 * kept on screen, never taking the pointer.
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
  const basket = avgBasket(hour.net, hour.transactions);
  const rows: [string, string][] = [
    ["Net sales", money(hour.net)],
    [
      "Share of the day",
      dayNet > 0 ? `${one((hour.net / dayNet) * 100)}%` : "—",
    ],
    ["Transactions", hour.transactions > 0 ? count(hour.transactions) : "—"],
    ["Avg basket", basket === null ? "—" : money(basket)],
    ["Qty", count(hour.qty)],
  ];

  return (
    <CursorTipBox x={x} y={y} className="py-2.5 min-w-[200px]">
      <div className="text-[14px] font-bold text-content mb-1.5 whitespace-nowrap">
        {hourRange(hour.hour)}
      </div>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-5 leading-relaxed whitespace-nowrap"
        >
          <span className="text-[13px] text-content">{label}</span>
          <span className="text-[13px] font-semibold text-content tabular-nums">
            {value}
          </span>
        </div>
      ))}
    </CursorTipBox>
  );
};

export default RecapHourTip;
