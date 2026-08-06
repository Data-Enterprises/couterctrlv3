import type { InfoGlossaryEntry } from "../../../components/InfoPopover";

/** Content for the "?" popover in the Forecast header.
 *
 *  Kept beside the page rather than in the component so the copy can be edited
 *  without touching layout, matching vendorsInfo.ts and lookupInfo.ts.
 *
 *  Every claim here was checked against the code that produces the figure —
 *  `enrichRows.ts`, `scenarioRows.ts`, `forecastDevSlice.ts` and
 *  `pages/forecast/utils` — not against what the labels imply.
 */
export const FORECAST_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Forecast",
  purpose:
    "Estimates what a list of items will sell in an ad week at a price you choose, using the last 90 days of that item's own price history at the selected stores. It is an estimate from past behaviour, not a promise.",
  glossary: [
    {
      term: "How the forecast is built",
      desc: "Each item's 90-day history is a set of price points — a price, the units sold at it, and the days it was active. A demand curve is fitted through those points, the units at your chosen price are read off it, and that rate is projected over the forecast window. Fewer price points means a weaker fit, which is why the popup tells you how many there are.",
    },
    {
      term: "Selecting items",
      desc: "Ticking items in this panel sets what the grid covers, what the totals above it add up, and what the batch setter writes to. Untick an item to see the ad without it. Nothing is refetched.",
    },
    {
      term: "Qty sold",
      desc: "Units sold at the applied price over the 90 days — history, not a forecast. Shows a dash when the applied price was typed rather than taken from history, since the item never sold at it.",
    },
    {
      term: "Active",
      desc: "Days out of 90 on which the item sold at least one unit anywhere in its price history. Not days on the shelf — an item can be stocked and sell nothing.",
    },
    {
      term: "At price",
      desc: "Days at the applied price, out of the item's active days. Dashes for a typed price for the same reason Qty sold does.",
    },
    {
      term: "Forecast",
      desc: "The window the forecast covers, in days. Always 7 today — the column exists because the window is meant to become configurable, and it is what Ad fcst falls back to when no ad days are set.",
    },
    {
      term: "Ad days",
      desc: "How many days of the window the item is actually on ad. Setting it re-runs that row's forecast. A dash means it hasn't been set, and the row is forecast over the plain window.",
    },
    {
      term: "Price",
      desc: "The price the row is forecast at. It starts as the item's highest-volume price point — the price it sold the most units at — not its current shelf price. Change it from the batch setter or by applying a scenario in the popup.",
    },
    {
      term: "Ad fcst",
      desc: "Forecast units at the row's price over its ad days, or over the forecast window if no ad days are set.",
    },
    {
      term: "Total",
      desc: "Ad fcst units multiplied by the row's price. Revenue, before any cost.",
    },
    {
      term: "Markdown",
      desc: "What the discount costs across the forecast units: regular retail minus the row's price, times Ad fcst. Regular retail is the item's non-promo price as the backend records it — not necessarily what is ringing today. Zero when the row is priced at or above regular retail.",
    },
    {
      term: "Notes",
      desc: "Free text against a row. Set one on every selected item from the toolbar above the grid, or on a single item in its popup. Notes export with the rows.",
    },
    {
      term: "The popup",
      desc: "Double-click a row for its price scenarios — every price the item has sold at, each costed out at the current ad days, with one click to apply. The calculator beside it prices something that isn't in the list; it reports back but writes nothing to the grid.",
    },
    {
      term: "AD badge",
      desc: "The item came off an uploaded ad list. Its ad retail is used as the forecast price, and that price is treated as a real price point when the curve is fitted, even though the item may never have sold at it.",
    },
    {
      term: "1pt badge",
      desc: "One price point in 90 days. There is no curve to fit, so the forecast is that single data point projected forward — the price can't be changed and the popup won't open.",
    },
    {
      term: "No sales history",
      desc: "UPCs the stores returned nothing for. Usually items new to the store, discontinued, or a bad UPC on the ad list. They export as their own list from the download button.",
    },
  ],
};
