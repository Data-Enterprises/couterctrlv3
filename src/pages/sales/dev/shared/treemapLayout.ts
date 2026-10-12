/**
 * Squarified treemap layout.
 *
 * Area is the only honest encoding for "where is the money": a bar chart of
 * forty vendors is unreadable and a list hides the shape entirely. Squarified
 * rather than slice-and-dice because the naive algorithm produces slivers a
 * few pixels wide — unreadable, and worse, unclickable.
 *
 * Pure geometry. It knows nothing about causes, vendors or dollars: give it
 * values and a box, get back rectangles.
 */

export interface Sized {
  value: number;
}

export type Placed<T> = T & {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Worst aspect ratio in a row, which is what decides when to close it. */
const worst = <T extends Sized>(
  row: T[],
  sum: number,
  side: number,
  scale: number,
): number => {
  const thickness = (sum * scale) / side;
  if (thickness <= 0) return Infinity;
  let m = 0;
  for (const item of row) {
    const length = (item.value * scale) / thickness;
    if (length <= 0) return Infinity;
    m = Math.max(m, Math.max(thickness / length, length / thickness));
  }
  return m;
};

/**
 * Lay `items` out in a box, largest first.
 *
 * Rows are packed along whichever side is currently shorter, and a row closes
 * when taking the next item would make the ratios worse. Items with no value
 * are dropped rather than given a zero-width rectangle nobody can see or hit.
 */
export const squarify = <T extends Sized>(
  items: T[],
  x: number,
  y: number,
  w: number,
  h: number,
): Placed<T>[] => {
  const out: Placed<T>[] = [];
  const rest = [...items]
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value);

  let remaining = rest.reduce((a, b) => a + b.value, 0);
  if (remaining <= 0 || w <= 0 || h <= 0) return out;

  let rx = x;
  let ry = y;
  let rw = w;
  let rh = h;

  while (rest.length) {
    const vertical = rw >= rh;
    const side = vertical ? rh : rw;
    const scale = (rw * rh) / remaining;

    let row: T[] = [];
    let sum = 0;
    let best = Infinity;

    while (rest.length) {
      const next = rest[0];
      const tryRow = [...row, next];
      const trySum = sum + next.value;
      const ratio = worst(tryRow, trySum, side, scale);
      if (row.length === 0 || ratio <= best) {
        row = tryRow;
        sum = trySum;
        best = ratio;
        rest.shift();
      } else break;
    }

    const thickness = (sum * scale) / side;
    let offset = 0;
    for (const item of row) {
      const length = (item.value * scale) / thickness;
      out.push({
        ...item,
        ...(vertical
          ? { x: rx, y: ry + offset, w: thickness, h: length }
          : { x: rx + offset, y: ry, w: length, h: thickness }),
      });
      offset += length;
    }

    if (vertical) {
      rx += thickness;
      rw -= thickness;
    } else {
      ry += thickness;
      rh -= thickness;
    }
    remaining -= sum;
  }

  return out;
};
