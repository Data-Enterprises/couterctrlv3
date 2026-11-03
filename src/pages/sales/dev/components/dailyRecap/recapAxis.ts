/**
 * Round gridlines for a chart whose tallest bar is `max`.
 *
 * About three steps, each a 1, 2, 2.5 or 5 times a power of ten, so the
 * labels read as $500 / $1,000 / $1,500 rather than $490 / $980. The top line
 * sits at or just above the tallest bar, which then reaches close to it
 * rather than floating under an empty band.
 */
export const niceTicks = (max: number, steps = 3): number[] => {
  if (!(max > 0)) return [0];
  const rough = max / steps;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(Math.round(t * 100) / 100);
  return ticks;
};
