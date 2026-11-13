// Components
import CursorTipBox from "./CursorTipBox";

interface CursorTipProps {
  lines: string[];
  x: number;
  y: number;
}

/**
 * The app's tooltip for words: a line or a few, following the mouse.
 *
 * An icon button's name ("Export CSV"), what a button will do ("Shows all
 * items sold this week"), a short list (an item's vendors). Pair it with
 * `useCursorTip`:
 *
 *   const { tip, track, clear } = useCursorTip<true>();
 *   <button onMouseMove={track(true)} onMouseLeave={clear} aria-label="Export CSV">…</button>
 *   {tip && <CursorTip lines={["Export CSV"]} x={tip.x} y={tip.y} />}
 *
 * For a readout with its own layout, use `CursorTipBox`.
 */
const CursorTip = ({ lines, x, y }: CursorTipProps) => (
  <CursorTipBox x={x} y={y}>
    {lines.map((l, i) => (
      <div
        key={i}
        className="text-[13px] leading-relaxed font-medium text-content max-w-[340px]"
      >
        {l}
      </div>
    ))}
  </CursorTipBox>
);

export default CursorTip;
