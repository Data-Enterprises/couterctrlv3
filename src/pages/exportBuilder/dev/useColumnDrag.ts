import { useEffect, useRef, useState } from "react";

/**
 * Dragging a column by its header.
 *
 * Pointer events rather than HTML5 drag-and-drop: the native API cannot show
 * the other columns moving aside — it gives you a ghost image and a drop
 * target, and everything else stays where it is until the drop. Here the
 * column under the cursor travels with it and the ones it passes slide over,
 * so the layout you are looking at during the drag is the layout you get.
 *
 * Nothing is committed until pointer-up: `offsetFor` describes the drag, the
 * order in the store is untouched, and Escape abandons it.
 */
export interface ColumnDrag {
  /** The column being carried, or null when nothing is happening. */
  name: string | null;
  /** Live pixel shift for a column, by its index in the visible order. */
  offsetFor: (index: number) => number;
  /** True while this column is the one under the cursor. */
  isDragging: (index: number) => boolean;
  /** Where it would land — for the drop line and the announcement. */
  targetIndex: number;
  start: (index: number, name: string, event: React.PointerEvent) => void;
  /** Header cells register here so their widths can be measured. */
  registerCell: (index: number) => (el: HTMLTableCellElement | null) => void;
}

interface Active {
  index: number;
  name: string;
  startX: number;
  dx: number;
  widths: number[];
  width: number;
}

/** How close to an edge the cursor has to get before the view follows it. */
const EDGE = 56;
const EDGE_SPEED = 14;

export const useColumnDrag = (
  scroller: React.RefObject<HTMLElement | null>,
  onDrop: (name: string, toIndex: number) => void,
): ColumnDrag => {
  const cells = useRef<(HTMLTableCellElement | null)[]>([]);
  const [active, setActive] = useState<Active | null>(null);
  const activeRef = useRef<Active | null>(null);
  activeRef.current = active;

  /**
   * Where the carried column would sit if it were dropped now.
   *
   * Walked rather than computed from an average width, because these columns
   * are nothing like even — `product_description` is many times `qty`.
   */
  const targetIndex = (() => {
    if (!active) return -1;
    const { index, dx, widths } = active;
    let target = index;
    if (dx > 0) {
      let travelled = 0;
      for (let i = index + 1; i < widths.length; i++) {
        travelled += widths[i];
        if (dx > travelled - widths[i] / 2) target = i;
      }
    } else if (dx < 0) {
      let travelled = 0;
      for (let i = index - 1; i >= 0; i--) {
        travelled += widths[i];
        if (-dx > travelled - widths[i] / 2) target = i;
      }
    }
    return target;
  })();

  useEffect(() => {
    if (!active) return;

    const move = (e: PointerEvent) => {
      const a = activeRef.current;
      if (!a) return;
      setActive({ ...a, dx: e.clientX - a.startX });

      // Ninety columns will not fit on screen, so the drag has to be able to
      // reach the ones that are not: near an edge, the view comes along.
      const el = scroller.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      if (e.clientX > box.right - EDGE) el.scrollLeft += EDGE_SPEED;
      else if (e.clientX < box.left + EDGE) el.scrollLeft -= EDGE_SPEED;
    };

    const up = () => {
      const a = activeRef.current;
      if (a) {
        const to = targetIndexOf(a);
        if (to !== a.index) onDrop(a.name, to);
      }
      setActive(null);
    };

    const cancel = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", cancel);
    };
    // `targetIndex` is recomputed from `active` on every render, so the
    // listeners read it through `targetIndexOf` rather than closing over it.
  }, [active !== null, onDrop, scroller]);

  return {
    name: active?.name ?? null,
    targetIndex,
    isDragging: (index) => active?.index === index,
    offsetFor: (index) => {
      if (!active) return 0;
      if (index === active.index) return active.dx;
      // Everything between here and where it is heading steps aside by
      // exactly the width of what is passing through.
      if (index > active.index && index <= targetIndex) return -active.width;
      if (index < active.index && index >= targetIndex) return active.width;
      return 0;
    },
    start: (index, name, event) => {
      const widths = cells.current.map((c) => c?.offsetWidth ?? 0);
      setActive({
        index,
        name,
        startX: event.clientX,
        dx: 0,
        widths,
        width: widths[index] ?? 0,
      });
    },
    registerCell: (index) => (el) => {
      cells.current[index] = el;
    },
  };
};

/** The same walk as above, for the listener that has only the drag state. */
const targetIndexOf = ({ index, dx, widths }: Active) => {
  let target = index;
  if (dx > 0) {
    let travelled = 0;
    for (let i = index + 1; i < widths.length; i++) {
      travelled += widths[i];
      if (dx > travelled - widths[i] / 2) target = i;
    }
  } else if (dx < 0) {
    let travelled = 0;
    for (let i = index - 1; i >= 0; i--) {
      travelled += widths[i];
      if (-dx > travelled - widths[i] / 2) target = i;
    }
  }
  return target;
};
