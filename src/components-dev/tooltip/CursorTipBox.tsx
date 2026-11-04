import type { ReactNode } from "react";
import { useTipPlacement } from "./useTipPlacement";

/**
 * The app's tooltip: a light box that follows the mouse.
 *
 * Use it instead of the browser's `title` box, which is small, dark, slow to
 * appear and styled by the browser rather than the theme. Pair it with
 * `useCursorTip`: the hook tracks what is under the pointer and where, and
 * this draws the box there.
 *
 * Fixed to the viewport so no card or scrolling panel clips it, placed below
 * and right of the pointer and flipped near the screen's edges
 * (`useTipPlacement`), and it never takes the pointer, so moving across the
 * targets is not interrupted.
 *
 * This is the frame; lay out what goes in it yourself (the Summary hour
 * chart's readout does). For a line or two of words, use `CursorTip`.
 */
const CursorTipBox = ({
  x,
  y,
  className = "py-2",
  children,
}: {
  /** The pointer, in screen coordinates (clientX/Y). */
  x: number;
  y: number;
  /** Vertical padding and any minimum width; the frame itself is fixed. */
  className?: string;
  children: ReactNode;
}) => {
  const { ref, pos } = useTipPlacement<HTMLDivElement>(x, y);
  return (
    <div
      ref={ref}
      role="tooltip"
      className={`fixed z-50 pointer-events-none rounded border border-gray-200 bg-custom-white shadow-lg px-3 ${className}`}
      style={{ left: pos.left, top: pos.top }}
    >
      {children}
    </div>
  );
};

export default CursorTipBox;
