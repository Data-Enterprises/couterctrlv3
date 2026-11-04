import CursorTipBox from "./CursorTipBox";

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
const CursorTip = ({
  lines,
  x,
  y,
}: {
  lines: string[];
  x: number;
  y: number;
}) => (
  <CursorTipBox x={x} y={y}>
    {lines.map((l) => (
      <div
        key={l}
        className="text-[13px] leading-relaxed font-medium text-content whitespace-nowrap"
      >
        {l}
      </div>
    ))}
  </CursorTipBox>
);

export default CursorTip;
