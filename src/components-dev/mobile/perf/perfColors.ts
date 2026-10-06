/**
 * The series colours for this screen, in one place.
 *
 * All of these are existing theme tokens read out of index.css, written as
 * literals because they are consumed by inline styles (widths and opacities
 * are computed, so these travel with them) rather than Tailwind classes.
 * Changing the screen's palette means changing this file and nothing else.
 *
 * WHY NOT NAVY
 * The app navy (--color-brand-navy) is the header colour. A full-width navy bar on every
 * row put the same weight on the data as on the chrome above it, and a card of
 * them reads as heavy. These are lighter and clearly a data series rather than
 * a surface.
 *
 * WHAT EACH ENCODES
 * Hue says the direction of the change: the TY bar is green when it is at or
 * above last year and red when it is below, and the LY bar stays neutral as
 * the thing being measured against. One bar carries the verdict, the other is
 * the baseline.
 *
 * This replaced an earlier scheme where hue said which YEAR (TY blue, LY grey)
 * and opacity said which of the pair was larger. Two bars already say which is
 * larger by being different lengths, so that spent the loudest channel on the
 * one fact the chart could not hide — and left "up or down", the thing the
 * reader actually came for, to be worked out from bar lengths. Asked for by a
 * client, and right on the merits.
 *
 * Direction is NOT severity. Nothing here grades against a threshold, which is
 * why these are the delta tokens rather than the severity ones, and why mobile
 * Performance can carry them while still showing no severity chips at all.
 */

/**
 * This year, when there is nothing to compare it to.
 *
 * --color-primary-a10, the theme's mid blue. No longer the bar colour in the
 * ordinary case — see UP_COLOR / DOWN_COLOR — but still the neutral reading
 * for a store with no history on file, where calling it green would claim a
 * rise from nothing. Also the screens' accent: back chevrons, spinners and
 * sort indicators all take it, which is why the bars got their own tokens
 * rather than this one being repointed.
 */
export const TY_COLOR = "#178ec6";

/** Last year. --color-brand-slate. Neutral grey-blue: clearly a different
 *  series from the blue rather than a tint of it, which a lighter blue would
 *  read as. */
export const LY_COLOR = "#5a6c84";

/**
 * This year, at or above last year. --color-delta-positive-text.
 *
 * The delta family rather than the severity family: these say which way a
 * figure moved, not whether it passed a threshold. Taken at the `text` stop
 * because the `bg` stops are pale tints meant to sit behind type, and a bar
 * that pale disappears against the card.
 */
export const UP_COLOR = "#106038";

/** This year, below last year. --color-delta-negative-text, the partner to
 *  UP_COLOR above and chosen on the same grounds. */
export const DOWN_COLOR = "#8e1010";

/**
 * The legend swatch for the TY series, as a hard-edged half-and-half.
 *
 * A legend has to name a series with one patch of colour, and this series no
 * longer has one — it is green or red depending on the row. Drawing either
 * alone would caption the chart with a claim about the data ("this year is
 * up"), so the swatch shows both states and the bars say which applies. Hard
 * stops, not a blend: a gradient would read as a third colour.
 */
export const TY_SWATCH_BG = `linear-gradient(90deg, ${UP_COLOR} 0 50%, ${DOWN_COLOR} 50% 100%)`;

/** Applied to whichever bar is smaller. Low enough to be unmistakable at a
 *  glance, high enough to stay legible against the card.
 *
 *  No longer used by the bars — hue says which way the pair went, so dimming
 *  the shorter one said the same thing a second time. Kept for the day chart's
 *  unscoped columns and for any graphic that still wants a stepped-back pair.
 */
export const LOSER_OPACITY = 0.42;

/** Applied to every unselected day once a day is scoped, so the week's shape
 *  survives without competing with the day being read. */
export const UNSCOPED_OPACITY = 0.2;

/**
 * The four coupon channels, as one ramp rather than four hues.
 *
 * These are four slices of a single figure, not four unrelated things, so
 * giving each its own colour would imply a categorical difference that does
 * not exist. Taken straight off the theme's secondary ramp
 * (--color-secondary-a10 through a40), darkest to lightest, matching the order
 * they stack and list in.
 */
export const COUPON_COLORS = {
  digital: "#52b5ee",
  elecStore: "#78c1f1",
  elecInstore: "#97cdf4",
  store: "#b2d9f7",
} as const;

export const COUPON_LABELS: Record<keyof typeof COUPON_COLORS, string> = {
  digital: "Digital",
  elecStore: "E. Store",
  elecInstore: "E. In-Store",
  store: "Store",
};
