import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizableBoxOptions {
  storageKey: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  /**
   * Which CSS property the drag writes. Consumers that render a fixed `height`
   * leave this alone. ResizableModalShell renders `maxHeight` so its panels can
   * size to their own content — and if the drag wrote `height` instead, the
   * first mousemove would apply a property nothing had set and snap the panel
   * from its content height to the stored one.
   */
  heightProperty?: "height" | "maxHeight";
}

interface Size {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// Drag-to-resize a container's width/height, persisted per-browser in
// localStorage (a UI preference, not app data — no reason for this to live
// in Redux or sync across devices). Committing to storage only happens on
// mouseup, not on every pixel of movement, to avoid write spam.
export const useResizableBox = ({
  storageKey,
  defaultWidth,
  defaultHeight,
  minWidth = 500,
  maxWidth = 1600,
  minHeight = 400,
  maxHeight = 1100,
  heightProperty = "height",
}: UseResizableBoxOptions) => {
  const [size, setSize] = useState<Size>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Size>;
        return {
          width: clamp(parsed.width ?? defaultWidth, minWidth, maxWidth),
          height: clamp(parsed.height ?? defaultHeight, minHeight, maxHeight),
        };
      }
    } catch {
      // Malformed or inaccessible storage — fall back to defaults.
    }
    return { width: defaultWidth, height: defaultHeight };
  });
  const [isResizing, setIsResizing] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, width: defaultWidth, height: defaultHeight });
  const liveSize = useRef<Size>(size);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      liveSize.current = {
        width: clamp(dragStart.current.width + dx, minWidth, maxWidth),
        height: clamp(dragStart.current.height + dy, minHeight, maxHeight),
      };
      // Mousemove can fire faster than the browser can paint (especially on
      // high-poll-rate input devices) — coalesce to at most one DOM write
      // per animation frame instead of one per event.
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        // Mutate the DOM directly during the drag instead of calling setSize
        // per pixel — this box sits above the whole tab tree, so a React
        // state update here re-renders every mounted view underneath it
        // (e.g. the Users grid) on every mousemove. Only commit to React
        // state once, on mouseup.
        if (boxRef.current) {
          boxRef.current.style.width = `${liveSize.current.width}px`;
          boxRef.current.style[heightProperty] = `${liveSize.current.height}px`;
        }
      });
    },
    [minWidth, maxWidth, minHeight, maxHeight, heightProperty],
  );

  const handleMouseUp = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    setIsResizing(false);
    setSize(liveSize.current);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isResizing) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(size));
    } catch {
      // Storage full/unavailable (private mode, quota) — not worth surfacing.
    }
    // setSize now only fires once per drag (on mouseup), so it's safe to
    // depend on `size` directly without re-triggering a write per pixel.
  }, [isResizing, size, storageKey]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    // Start from what is actually on screen, not from state. The two can
    // disagree — a panel sized by its content under `maxHeight`, or one still
    // sized by a CSS class before any drag has happened — and anchoring the
    // drag to state makes the first mousemove jump by the whole difference.
    // Measuring makes the very first drag behave exactly like every one after.
    const rect = boxRef.current?.getBoundingClientRect();
    const from = {
      width: clamp(rect?.width ?? size.width, minWidth, maxWidth),
      height: clamp(rect?.height ?? size.height, minHeight, maxHeight),
    };
    dragStart.current = { x: e.clientX, y: e.clientY, ...from };
    liveSize.current = from;
    setIsResizing(true);
  };

  return {
    width: size.width,
    height: size.height,
    isResizing,
    boxRef,
    handleProps: { onMouseDown },
  };
};
