import { useEffect, useRef, useState } from "react";

/**
 * The live pixel size of an element.
 *
 * The charts are hand-rolled SVG with real type in them, so they cannot be
 * scaled with `viewBox` and `preserveAspectRatio` the way a decorative graphic
 * could — that stretches the axis labels along with the bars, and a chart on a
 * large monitor would end up with 15px axis text while the same chart on a
 * laptop dropped below the legibility floor. Measuring and re-drawing keeps the
 * type at exactly the size it was set at, whatever the container does.
 *
 * Returns zero until the first observation, so callers should hold off drawing
 * rather than render a chart at zero width and immediately replace it.
 */
export const useElementSize = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      // Rounded, so a sub-pixel layout change cannot put this into a render
      // loop with the chart it is sizing.
      setSize((prev) => {
        const width = Math.round(box.width);
        const height = Math.round(box.height);
        return prev.width === width && prev.height === height
          ? prev
          : { width, height };
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
};
