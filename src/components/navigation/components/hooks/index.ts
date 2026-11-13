// Hooks
import { useEffect, useState } from "react";

/** How long the avatar menu takes to open or close, in ms. */
export const MENU_ANIM_MS = 160;

/**
 * Keeps a pop-up mounted long enough to animate out. `shown` turns on a frame
 * after mounting, so the opening transition has a start state to run from, and
 * off at once on close; `mounted` follows `MENU_ANIM_MS` later.
 */
export const usePresence = (open: boolean) => {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), MENU_ANIM_MS);
    return () => clearTimeout(t);
  }, [open]);

  return { mounted, shown };
};
