import { useTipPlacement } from "./useTipPlacement";

/**
 * A few lines of words following the mouse, in the hour chart's tip style:
 * the View items button's, and the list of an item's vendors.
 *
 * Fixed to the viewport so no card clips it, kept on screen, and never takes
 * the pointer.
 */
const RecapTextTip = ({ lines, x, y }: { lines: string[]; x: number; y: number }) => {
  const { ref, pos } = useTipPlacement<HTMLDivElement>(x, y);
  return (
    <div
      ref={ref}
      role="tooltip"
      className="fixed z-50 pointer-events-none rounded border border-gray-200 bg-custom-white shadow-lg px-3 py-2"
      style={{ left: pos.left, top: pos.top }}
    >
      {lines.map((l) => (
        <div key={l} className="text-[13px] leading-relaxed font-medium text-content whitespace-nowrap">
          {l}
        </div>
      ))}
    </div>
  );
};

export default RecapTextTip;
