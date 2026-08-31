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
}

/**
 * This year against last year, as two bars on a shared scale.
 *
 * The larger of the pair sits at full strength and the smaller steps back.
 * That is the only thing opacity encodes — which figure is bigger — and it is
 * deliberately NOT a judgment. A store ahead of last year and a store behind
 * it get the same treatment; only the position of the full-strength bar moves.
 *
 * Replaces the half-donut the legacy Sales view used. That ring split its
 * circumference between the two years, which makes the whole ring TY + LY —
 * a quantity that means nothing. Two bars compare the values directly, and
 * fit in a row rather than needing half a screen each.
 */
const PairedBars = ({ ty, ly, max, compact = false }: Props) => {
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
        <span
          className="block h-full rounded-[3px]"
          style={{
            width: `${Math.max((value / safeMax) * 100, 1)}%`,
            background: colour,
            opacity: dimmed ? LOSER_OPACITY : 1,
          }}
        />
      </span>
      <span
        className="min-w-[76px] flex-none text-right text-[12.5px] font-bold tabular-nums text-content"
        style={{ opacity: dimmed ? LOSER_OPACITY : 1 }}
      >
        {formatCurrency2(value)}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {bar("TY", ty, TY_COLOR, !tyWins)}
      {bar("LY", ly, LY_COLOR, tyWins)}
    </div>
  );
};

export default PairedBars;
