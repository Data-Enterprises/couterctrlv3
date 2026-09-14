import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Scroll position for a mobile drill-down: top on the way in, back where you
 * were on the way out.
 *
 * The mobile Performance pages drill inside one scroll container — stores to
 * cashiers to transactions, departments to items — so without this, tapping a
 * row near the bottom of a long list opened the next level still scrolled to
 * that point, and you had to scroll up to find where it starts. Going back
 * returns to the row you tapped rather than the top of the list.
 *
 * `depth` says how far in the screen is (0 = the top list); `key` names the
 * exact view, so two different stores at the same depth don't share a
 * position. Runs as a layout effect so the old position never paints.
 *
 * `anchor` is where a new level starts when that isn't the top of the scroll —
 * Sales opens items inside the list card, below the totals and the chart.
 *
 * Scroll offsets are DOM state, not app state — they live in a ref, not Redux.
 */
export const useDrillScroll = (
  container: RefObject<HTMLElement | null>,
  depth: number,
  key: string,
  anchor?: RefObject<HTMLElement | null>,
) => {
  const saved = useRef(new Map<string, number>());

  /** The top of the new level: the anchor's edge, less a small gap, or 0. */
  const startOf = (el: HTMLElement) => {
    const a = anchor?.current;
    if (!a) return 0;
    const offset = a.getBoundingClientRect().top - el.getBoundingClientRect().top;
    return Math.max(0, el.scrollTop + offset - 12);
  };
  const prev = useRef({ depth, key });

  useLayoutEffect(() => {
    const el = container.current;
    const last = prev.current;
    prev.current = { depth, key };
    if (!el || last.key === key) return;

    if (depth > last.depth) {
      // Deeper: remember the list we're leaving, start the new level at its top.
      saved.current.set(last.key, el.scrollTop);
      el.scrollTop = startOf(el);
    } else if (depth < last.depth) {
      // Back out: return to where this level was left.
      el.scrollTop = saved.current.get(key) ?? 0;
      saved.current.delete(last.key);
    } else {
      // Sideways — another tab or another row at the same level. Only ever
      // up: someone reading the top of the page who switches tab shouldn't be
      // dropped down to the list.
      el.scrollTop = Math.min(el.scrollTop, startOf(el));
    }
  }, [depth, key]);
};
