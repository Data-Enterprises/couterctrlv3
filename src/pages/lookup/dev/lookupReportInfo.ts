import type { InfoGlossaryEntry } from "../../../components-dev/InfoPopover";

/**
 * The mobile "?" sheet for the Item Lookup report — dev only.
 *
 * Separate from `LOOKUP_INFO`, which describes the desktop screen and the
 * table this replaced: it explains a Qty column beside a Weight one, a "Back
 * to sales" link and the queue/report split, none of which exist here. Help
 * that describes a screen the reader is not looking at is worse than none.
 */
export const LOOKUP_REPORT_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Item Lookup",
  purpose:
    "One item at one store over the last fourteen days — what it sold, what it sold at, and how that has moved. Nothing is graded: the figures sit as they are and you draw the conclusion.",
  glossary: [
    {
      term: "The bar chart",
      desc: "One column per day, sized by what the item took. It is also this screen's only filter: tap a column to scope the figures beneath it to that day, and tap the same column again for the whole window. A day with no sales is a flat stub and cannot be tapped.",
    },
    {
      term: "Pounds or a count",
      desc: 'An item priced on the scale is measured in pounds; anything else is counted. You see one or the other, never both — a scale item rings a quantity of zero, so a count beside it would be a column of nothing. "$7.68/lb" is what it actually went out at, which moves with promotions.',
    },
    {
      term: "Sold · 13 of 14 days",
      desc: "How many days in the window actually sold. Every per-day average divides by that number rather than by fourteen, so a slow fortnight is not made to look worse by the days the item never sold at all.",
    },
    {
      term: "Per selling day",
      desc: "Takings divided by the days that sold. The figure beside it is the same for pounds or units.",
    },
    {
      term: "Best day",
      desc: "The biggest day by takings inside the window, with what it took.",
    },
    {
      term: "Share of window / vs typical day",
      desc: "Shown once a day is scoped. Share is that day against the whole window. Typical day compares it with the average of the days that SOLD — measured against the window it would flatter every day the item opened.",
    },
    {
      term: "Cost and margin",
      desc: 'Cost is what one unit cost after any vendor allowance, not the invoice list price, which is why margin here agrees with Sub Dept Margins. When no cost is on file the screen says so once, rather than reporting a margin computed from a cost of zero.',
    },
    {
      term: "Shelf price",
      desc: "The item's list price, shown when there is no cost to report a margin against.",
    },
    {
      term: "By sale type",
      desc: "Every register line is a Sale, Backup (a restored transaction), Cancelled or Voided. The headline figures count Sale lines only. Tap another type to read its days instead; tap it again to come back. Cost and margin are left off those, since they are not sales.",
    },
    {
      term: "Day by day",
      desc: "Every day in the window, newest first, with what it took, how much moved and the rate it went out at. It is a list, not a control — the chart above is what scopes the screen, and the row for a scoped day is highlighted here so you can see which one the figures describe.",
    },
    {
      term: "Slowing down",
      desc: "Appears when the second week of the window moved noticeably less than the first, even if the item is still selling.",
    },
    {
      term: "No sales in the last N days",
      desc: "A run of days with nothing sold, counting back from the end of the window. Often a sign an item is out of stock or delisted rather than merely slow.",
    },
    {
      term: "The window",
      desc: "Fourteen days ending yesterday, not today — today's sales have not finished posting.",
    },
    {
      term: "Location",
      desc: "A few stores share one store ID across two locations. When that happens you can switch between them; the figures are never added together.",
    },
  ],
};
