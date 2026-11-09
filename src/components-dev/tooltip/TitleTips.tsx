// Hooks
import { useEffect, useRef, useState } from "react";

// Interfaces
import type { Held } from "./interfaces";

// Components
import CursorTip from "./CursorTip";

/**
 * Every `title` tooltip in the dev tree, drawn as the app's CursorTip instead
 * of the browser's dark title box.
 *
 * Mounted once, beside the page (App, dev API only). It watches the pointer:
 * on reaching an element with a `title`, it lifts the title off so the
 * browser has nothing to show, and draws a CursorTip there following the
 * mouse; on leaving it, it puts the title back. So the source keeps plain
 * `title` attributes, which also stay the accessible name of an icon-only
 * button, and any title added later gets the same tip without being wired.
 *
 * A title's line breaks become the tip's lines. A press hides the tip until
 * the pointer leaves, as the browser's does. Elements that already draw a
 * CursorTip of their own carry no `title`, so they are never doubled.
 */
const TitleTips = () => {
  const [tip, setTip] = useState<{ lines: string[]; x: number; y: number } | null>(null);
  const held = useRef<Held | null>(null);
  const pressed = useRef(false);

  useEffect(() => {
    const release = () => {
      const h = held.current;
      if (h) h.el.setAttribute("title", h.title);
      held.current = null;
      pressed.current = false;
    };

    const move = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const h = held.current;
      if (h && target && h.el.contains(target)) {
        if (!pressed.current) {
          setTip({ lines: h.title.split("\n"), x: e.clientX, y: e.clientY });
        }
        return;
      }
      if (h) {
        release();
        setTip(null);
      }
      const el = target?.closest("[title]");
      const title = el?.getAttribute("title")?.trim();
      if (!el || !title) return;
      held.current = { el, title };
      el.removeAttribute("title");
      setTip({ lines: title.split("\n"), x: e.clientX, y: e.clientY });
    };

    const press = () => {
      if (!held.current) return;
      pressed.current = true;
      setTip(null);
    };

    const leave = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      release();
      setTip(null);
    };

    document.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mousedown", press, true);
    document.addEventListener("mouseout", leave);
    const blur = () => {
      release();
      setTip(null);
    };
    window.addEventListener("blur", blur);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousedown", press, true);
      document.removeEventListener("mouseout", leave);
      window.removeEventListener("blur", blur);
      release();
    };
  }, []);

  return tip ? <CursorTip lines={tip.lines} x={tip.x} y={tip.y} /> : null;
};

export default TitleTips;
