import { useEffect, useState } from "react";
import type { HelpAnchor } from "./helpTypes";

export interface HighlightBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Where the control an entry names is, on screen, right now.
 *
 * Returns the box to draw over it, or null when nothing on the page carries
 * that anchor — which happens honestly and often: a control inside a tab that
 * is not open, or a panel that only exists once a search has run. The panel
 * says "not on screen right now" in that case rather than drawing a ring
 * around nothing.
 *
 * **It draws over the element, never on it.** Setting an outline or a class
 * on the target means reaching into a component that knows nothing about
 * help, and leaving it changed if anything throws in between. An absolutely
 * positioned box costs one measurement and cannot damage what it points at.
 *
 * The box is re-measured on scroll and resize while an anchor is active, and
 * the listeners come off the moment it is cleared — a highlight that follows
 * a control is worth the two listeners; one that keeps measuring after the
 * panel closed is not.
 */
export const useHelpHighlight = (anchor: HelpAnchor | null) => {
  const [box, setBox] = useState<HighlightBox | null>(null);

  useEffect(() => {
    if (!anchor) {
      setBox(null);
      return;
    }

    const measure = () => {
      const el = document.querySelector(`[data-help="${anchor}"]`);
      if (!el) {
        setBox(null);
        return;
      }
      const r = el.getBoundingClientRect();
      // Zero-sized means present but not rendered — a collapsed panel, a tab
      // that is not open. Treated as absent, because pointing at a point is
      // worse than admitting it is not there.
      if (r.width === 0 && r.height === 0) {
        setBox(null);
        return;
      }
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    // Scroll it into view once, then follow it. `block: "center"` rather than
    // the default, so a control at the foot of a list does not land under the
    // panel's own footer.
    const el = document.querySelector(`[data-help="${anchor}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });

    measure();
    // Capture phase: the control may sit inside its own scrolling panel, and a
    // scroll there does not bubble.
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [anchor]);

  return box;
};
