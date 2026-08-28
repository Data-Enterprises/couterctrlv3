import { useLayoutEffect, useRef, useState } from "react";

/**
 * The hover card over a contribution bar.
 *
 * Positioned `fixed` off the hovered row's own rectangle rather than absolutely
 * inside the panel. The panel rounds its corners with `overflow-hidden` and the
 * tab above it scrolls, so an absolutely-positioned card would be clipped by
 * one or the other — a tooltip that only half appears is worse than none.
 *
 * Flips above the row when there is no room below, and clamps to the viewport
 * horizontally, so a row near the bottom or the right edge still reads.
 *
 * Navy, like the app's other overlays. It is an explanation floating over the
 * page, and the severity colours are for things being graded.
 */
interface Props {
  /** The hovered row's rectangle, in viewport coordinates. */
  anchor: DOMRect;
  children: React.ReactNode;
}

const WIDTH = 320;
const GAP = 8;
const MARGIN = 12;

const ContributionTooltip = ({ anchor, children }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ top: number; left: number }>({
    top: anchor.bottom + GAP,
    left: anchor.left,
  });

  useLayoutEffect(() => {
    const height = ref.current?.offsetHeight ?? 0;
    const below = anchor.bottom + GAP;
    const fitsBelow = below + height + MARGIN <= window.innerHeight;

    setPlacement({
      top: fitsBelow ? below : Math.max(MARGIN, anchor.top - GAP - height),
      left: Math.min(
        Math.max(MARGIN, anchor.left),
        window.innerWidth - WIDTH - MARGIN,
      ),
    });
  }, [anchor]);

  return (
    <div
      ref={ref}
      role="tooltip"
      style={{ top: placement.top, left: placement.left, width: WIDTH }}
      className="fixed z-[60] rounded-lg bg-[#1e2a4a] px-3.5 py-2.5 shadow-xl text-[13px] leading-relaxed text-custom-white pointer-events-none"
    >
      {children}
    </div>
  );
};

export default ContributionTooltip;
