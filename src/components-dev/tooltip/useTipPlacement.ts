import { useLayoutEffect, useRef, useState } from "react";

/** How far a tip sits from the cursor, and from the screen's edges. */
const GAP = 14;
const EDGE = 8;

/**
 * Where a cursor tip goes: below and right of the pointer, flipped left near
 * the right edge and up near the bottom, measured after it renders so it
 * fits whatever the panel's size or the browser's zoom. Screen coordinates,
 * for a tip drawn fixed to the viewport where no card can clip it.
 */
export const useTipPlacement = <E extends HTMLElement>(
  x: number,
  y: number,
) => {
  const ref = useRef<E>(null);
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

  return { ref, pos };
};
