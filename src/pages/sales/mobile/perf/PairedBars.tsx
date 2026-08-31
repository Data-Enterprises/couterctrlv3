import { formatCurrency2 } from "../../../../utils";
import { LOSER_OPACITY, LY_COLOR, TY_COLOR } from "./perfColors";

interface Props {
  ty: number;
  ly: number;
  /** The largest figure anywhere in the list, so every row shares one scale.
   *  Scaling each row to its own maximum would make a $200 department look the
   *  same size as a $20,000 one. */
  max: number;
  /** Tightens the row for use inside the totals card. */
  compact?: boolean;
  /** Row captions. Sales and Margins compare periods; Loss Prevention and
   *  Coupon Sales compare a week against its own baseline, which is the same
   *  picture with different words on it. */
  labels?: [string, string];
  /** How the figures read. Counts are not money, and formatting an exception
   *  tally as $363.00 is the kind of wrong that survives review. */
  format?: (n: number) => string;
}

/**
 * This year against last year, as two bars on a shared scale.
 *
 * The larger of the pair sits at full strength and the smaller steps back.
 *
 * Both the length and the dimming animate, so tapping a day or swiping a lens
 * redistributes the list in front of you instead of cutting to a new
 * arrangement — and when a tap flips which side is longer, the emphasis
 * cross-fades rather than snapping. Rows are keyed by store, cashier or
 * product, so those nodes survive the change and have something to animate;
 * switching tabs replaces them outright and lands without motion, which is
 * right, because that is a new list rather than this one changing.
 * That is the only thing opacity encodes — which figure is bigger — and it is
 * deliberately NOT a judgment. A store ahead of last year and a store behind
 * it get the same treatment; only the position of the full-strength bar moves.
 *
 * Replaces the half-donut the legacy Sales view used. That ring split its
 * circumference between the two years, which makes the whole ring TY + LY —
 * a quantity that means nothing. Two bars compare the values directly, and
 * fit in a row rather than needing half a screen each.
 */
const PairedBars = ({
  ty,
  ly,
  max,
  compact = false,
  labels = ["TY", "LY"],
  format = formatCurrency2,
}: Props) => {
  const safeMax = max > 0 ? max : 1;
  const tyWins = ty >= ly;

  const bar = (
    label: string,
    value: number,
    colour: string,
    dimmed: boolean,
  ) => (
    <div className="flex items-center gap-2">
      <span className="w-5 flex-none font-mono text-[9.5px] font-semibold tracking-wider text-content/85">
        {label}
      </span>
      <span
        className={`flex-1 overflow-hidden rounded-[3px] bg-bkg ${compact ? "h-2.5" : "h-3"}`}
      >
        {/* Scaled, not widthed.
         *
         * The visual is identical, but `transform` runs on the compositor
         * while `width` runs layout on every frame. That matters here and not
         * on the day chart: tapping a day changes `max`, so every bar in a
         * hundred-row list moves at once — two hundred layout invalidations a
         * frame on the phones least able to afford them.
         *
         * The 1% floor is the old `width` floor: a row that rang nothing still
         * shows a sliver, so an empty row reads as empty rather than missing.
         */}
        <span
          className="block h-full w-full origin-left rounded-[3px] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none"
          style={{
            transform: `scaleX(${Math.max(value / safeMax, 0.01)})`,
            background: colour,
            opacity: dimmed ? LOSER_OPACITY : 1,
          }}
        />
      </span>
      <span
        className="min-w-[76px] flex-none text-right text-[12.5px] font-bold tabular-nums text-content"
        style={{ opacity: dimmed ? LOSER_OPACITY : 1 }}
      >
        {format(value)}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {bar(labels[0], ty, TY_COLOR, !tyWins)}
      {bar(labels[1], ly, LY_COLOR, tyWins)}
    </div>
  );
};

export default PairedBars;
