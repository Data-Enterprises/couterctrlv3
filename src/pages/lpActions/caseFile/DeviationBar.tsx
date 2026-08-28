/**
 * How far past their own normal one exception type sits.
 *
 * The axis is **shared and fixed at 0×–4× on every card**, with a mark at 1×.
 * That is the whole point of the control: a 3.3× on nineteen cancels and a
 * 1.6× on twenty-six no-sales are only comparable if they are drawn against
 * the same ruler. Scaling each bar to its own value rebuilds the sparkline
 * problem, where every row looks equally alarming.
 *
 * Values past the ceiling clamp the fill but never the label — a 7.2× still
 * reads 7.2×, it just stops growing.
 */
interface Props {
  multiple: number | null;
  /** The type's own hue. Identity, not severity — the number beside the bar
   *  carries how alarming it is. */
  colour: string;
}

const MAX = 4;

const DeviationBar = ({ multiple, colour }: Props) => {
  const width = multiple === null ? 0 : (Math.min(multiple, MAX) / MAX) * 100;

  return (
    <div>
      <div className="relative h-[7px] rounded-sm bg-row_stripe overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{ width: `${width}%`, background: colour }}
        />
        {/* The 1× mark. Everything left of it is below their normal. */}
        <div
          className="absolute inset-y-0 w-px bg-content/40"
          style={{ left: `${(1 / MAX) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-0.5 text-[8.5px] text-content/85">
        <span>0×</span>
        <span>1× base</span>
        <span>2×</span>
        <span>3×</span>
        <span>{MAX}×</span>
      </div>
    </div>
  );
};

export default DeviationBar;
