/**
 * The class strings and column template the recap's pieces share.
 *
 * The day head and the day rows are drawn by separate components but have to
 * line up, so they read from one place, the way the LP case grids keep
 * theirs level.
 *
 * The look is the popup's own (the Top 200 tab beside this one): an 11px bold
 * uppercase head on gray-50, a gray-100 hairline under every row, a gray-50
 * row under the pointer, and cards on brand_paper rather than raw white.
 */

export const HEAD =
  "grid items-end gap-3 px-3.5 py-1.5 border-b border-gray-100 bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-content";

/**
 * A day row. It fills whatever height its track in the list is given, and it
 * is not a control: the day cards above the tabs are the one way to pick a
 * day, so a row neither highlights nor answers a click. Rows stripe, as
 * the dense grids do.
 */
export const ROW =
  "w-full h-full min-h-0 grid items-center gap-3 px-3.5 py-1 text-[13px] text-content border-b border-gray-100 even:bg-row_stripe";

export const CARD = "rounded-[10px] border border-brand_line bg-brand_paper shadow-card";

/** A card's title bar: a tint of the page ground, a hairline under it. */
export const CARD_BAR =
  "flex flex-none items-center gap-2 px-4 bg-bkg/40 border-b border-brand_line";

/** The ground the day's cards sit on: the panel's own white, so the cards'
 *  shadows are what lift them. */
export const TRAY = "bg-custom-white";

export const CARD_TITLE = "text-[11px] font-bold uppercase tracking-wide text-content";

export const NUM = "text-right tabular-nums";

/** The shortest a day row may get before the list scrolls instead. */
export const ROW_MIN_PX = 36;

/**
 * Day, net sales, trans, avg basket, items, qty, [weight], busiest hour.
 *
 * The figures get fixed widths, packed together, and the busiest hour takes
 * the rest. Stretching every column to share the width spread the figures out
 * and left their right-aligned heads floating at uneven distances; fixed
 * widths keep each head over its own figures. The busiest-hour track can
 * shrink to its floor, so a narrow panel squeezes the chart, never the
 * figures, and nothing pushes the row sideways.
 */
export const dayCols = (withPounds: boolean, narrow: boolean) => {
  const weight = withPounds ? (narrow ? " 68px" : " 84px") : "";
  return narrow
    ? `68px 92px 56px 80px 56px 64px${weight} minmax(90px,1fr)`
    : `88px 108px 72px 96px 72px 80px${weight} minmax(150px,1fr)`;
};
