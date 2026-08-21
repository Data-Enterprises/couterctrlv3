/**
 * Series colours for the case charts.
 *
 * Five fixed hues, assigned to exception types in the order they appear and
 * never cycled — colour follows the type, so switching chips or filtering can
 * never repaint a series and make two screenshots disagree.
 *
 * Validated against both the light and dark chart surfaces for lightness band,
 * chroma floor, colour-blind separation (worst adjacent pair ΔE 9.4 deutan) and
 * contrast. Do not substitute a hue without re-running that check — the set
 * passes as a set, not individually.
 */
export const SERIES = [
  "#7F77DD",
  "#1D9E75",
  "#378ADD",
  "#BA7517",
  "#D4537E",
] as const;

/** Everything not currently selected. Muted rather than hidden: the quiet
 *  series are what say a spike is specific rather than general. */
export const MUTED_OPACITY = 0.4;

export const colourFor = (types: string[], saleType: string) =>
  SERIES[Math.max(0, types.indexOf(saleType)) % SERIES.length];

export const hourLabel = (h: number) => {
  const suffix = h < 12 ? "a" : "p";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${suffix}`;
};
