import { useCallback, useEffect, useRef, useState } from "react";

/** Below this width the recap lays itself out for a narrow panel. */
export const NARROW_PANEL_PX = 860;

/** Below this height it tightens up so the week's seven days still fit. */
export const SHORT_PANEL_PX = 600;

/**
 * The tab's own size, as two answers: is it narrow, and is it short.
 *
 * The store panel's size is not the window's. It shares the screen with the
 * ledger, the day cards and the panel header sit above it, and browser zoom
 * and display scaling change how much of it there is: the same 1920px screen
 * gave the week's rows dead space at one zoom and clipped Monday at another.
 * A media query would answer the wrong question, and Tailwind 3 here has no
 * container queries, so this measures the tab itself.
 *
 * Starts at full size and stays there where ResizeObserver does not exist
 * (tests), so the default is the full layout rather than a guess.
 */
export const usePanelSize = (
  narrowBelow: number = NARROW_PANEL_PX,
  shortBelow: number = SHORT_PANEL_PX,
) => {
  const [size, setSize] = useState({ narrow: false, short: false });
  const observer = useRef<ResizeObserver | null>(null);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!el || typeof ResizeObserver === "undefined") return;
      const measure = () => {
        const { width, height } = el.getBoundingClientRect();
        // A zero side is a panel not laid out yet, not a tiny one.
        const narrow = width > 0 && width < narrowBelow;
        const short = height > 0 && height < shortBelow;
        setSize((s) => (s.narrow === narrow && s.short === short ? s : { narrow, short }));
      };
      measure();
      observer.current = new ResizeObserver(measure);
      observer.current.observe(el);
    },
    [narrowBelow, shortBelow],
  );

  useEffect(() => () => observer.current?.disconnect(), []);

  return { ref, ...size };
};
