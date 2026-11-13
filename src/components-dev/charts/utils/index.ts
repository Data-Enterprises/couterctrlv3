/**
 * Tick values on round numbers spanning the data.
 *
 * Interpolating between the exact min and max gives ticks like $16.1K and
 * $20.7K, which are precise and unreadable: an axis exists to be glanced at,
 * and no one holds an odd number in their head while comparing two lines.
 */
export const niceTicks = (min: number, max: number, count: number): number[] => {
  const span = max - min || Math.abs(max) || 1;
  const rawStep = span / Math.max(1, count - 1);
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  const step = (norm > 5 ? 10 : norm > 2 ? 5 : norm > 1 ? 2 : 1) * mag;

  const first = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = first; v <= max + step * 0.001; v += step) ticks.push(v);
  return ticks.length >= 2 ? ticks : [min, max];
};

/** The trend chart's drawing width and its padding on each side. */
export const W = 620;
export const PAD_L = 62;
export const PAD_R = 12;
export const PAD_T = 22;
export const PAD_B = 26;
