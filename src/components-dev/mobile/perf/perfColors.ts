/**
 * The series colours for this screen, in one place.
 *
 * All of these are existing theme tokens read out of index.css, written as
 * literals because they are consumed by inline styles (widths and opacities
 * are computed, so these travel with them) rather than Tailwind classes.
 * Changing the screen's palette means changing this file and nothing else.
 *
 * WHY NOT NAVY
 * The app navy (#1e2a4a) is the header colour. A full-width navy bar on every
 * row put the same weight on the data as on the chrome above it, and a card of
 * them reads as heavy. These are lighter and clearly a data series rather than
 * a surface.
 *
 * WHAT EACH ENCODES
 * Hue says which year. Opacity says which of the pair is larger, and nothing
 * more — a store ahead of last year and a store behind it are drawn the same
 * way; only the position of the full-strength bar moves.
 */

/** This year. --color-primary-a10, the theme's mid blue. */
export const TY_COLOR = "#178ec6";

/** Last year. --color-brand-slate. Neutral grey-blue: clearly a different
 *  series from the blue rather than a tint of it, which a lighter blue would
 *  read as. */
export const LY_COLOR = "#5a6c84";

/** Applied to whichever bar is smaller. Low enough to be unmistakable at a
 *  glance, high enough to stay legible against the card. */
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
