import type { InfoGlossaryEntry } from "../../../components/InfoPopover";

/** Content for the "?" popover in the Forecast header.
 *
 *  Kept beside the page rather than in the component so the copy can be edited
 *  without touching layout, matching vendorsInfo.ts and lookupInfo.ts.
 *
 *  Every claim here was checked against the code that produces the figure —
 *  `enrichRows.ts`, `scenarioRows.ts`, `forecastRanking.ts`, `forecastDevSlice`
 *  and `pages/forecast/utils` — not against what the labels imply.
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
      term: "Driving, Supporting, Tail",
      desc: "Items are ranked by what they contribute to the forecast total, then split into three bands. A band is a coverage floor, not a fixed share — it always lands on or above its cut, because the item that crosses the line stays in the band it crossed from. These are sizes, not grades: a Tail item isn't underperforming, it's small.",
      subEntries: [
        {
          label: "Driving",
          desc: "The fewest items covering at least 80% of the forecast. Get these prices right and the total is roughly right.",
        },
        {
          label: "Supporting",
          desc: "The next items, taking coverage to at least 95%.",
        },
        {
          label: "Tail",
          desc: "Everything after that. Often most of the item count and almost none of the money — worth asking whether it earns its markdown.",
        },
      ],
    },
    {
      term: "Rank and Share",
      desc: "Rank is the item's position by forecast total, biggest first — which is also the grid's default order until you sort a column. Share is its slice of that total. Both are worked out across everything ticked in the panel, before any filtering, so a share never changes meaning while you narrow the list.",
    },
    {
      term: "Flags",
      desc: "Amber tags beside the UPC. They judge the forecast, never the item, and hovering one says what was measured.",
      subEntries: [
        {
          label: "thin history",
          desc: "Two or fewer price points behind the fit. Only shown on Driving and Supporting items — a shaky number on 0.1% of the ad isn't worth the interruption.",
        },
        {
          label: "untested price",
          desc: "The applied price has never been run on this item, so the forecast is extrapolated rather than observed.",
        },
        {
          label: "markdown heavy",
          desc: "The item is taking a bigger share of the ad's markdown than of its revenue. Not wrong, but it's the one paying for the ad.",
        },
        {
          label: "beats record",
          desc: "The forecast runs at more units per day than the item's best day in 90 days. Often the point of an ad — it just shouldn't arrive unannounced.",
        },
      ],
    },
    {
      term: "Selecting and filtering",
      desc: "Ticking items in the left panel sets what the grid covers and what the totals add up. The band chips narrow that further, and they combine — Driving plus Tail is a valid view. UPC and Desc on the Item header search within whatever is left. Collapsing a band hides its rows but keeps them in scope; folding isn't filtering.",
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
      desc: "The price the row is forecast at. It starts as the item's highest-volume price point — the price it sold the most units at — not its current shelf price.",
    },
    {
      term: "Ad fcst",
      desc: "Forecast units at the row's price over its ad days, or over the forecast window if no ad days are set.",
    },
    {
      term: "Total",
      desc: "Ad fcst units multiplied by the row's price. Revenue, before any cost, and what the ranking is built on.",
    },
    {
      term: "Markdown",
      desc: "What the discount costs across the forecast units: regular retail minus the row's price, times Ad fcst. Regular retail is the item's non-promo price as the backend records it — not necessarily what is ringing today. Zero when the row is priced at or above regular retail.",
    },
    {
      term: "Setting values in bulk",
      desc: "The toolbar writes to the rows on screen — after the band chips and the column filters, not everything ticked. Filter to Tail and Apply touches Tail only.",
      subEntries: [
        {
          label: "Apply",
          desc: "Writes ad days, price and a note in one go. Price and ad days skip single-price items; a note goes to all of them.",
        },
        {
          label: "Reset",
          desc: "Puts price and ad days back to what the search returned. Notes are left alone — they're your writing, not an edit to the forecast.",
        },
        {
          label: "Clear notes",
          desc: "Removes the note from those rows. Separate from Reset so neither does the other's job by accident.",
        },
      ],
    },
    {
      term: "Notes",
      desc: "Free text against a row, set in bulk from the toolbar or on one item in its popup. Notes export with the rows.",
    },
    {
      term: "The popup",
      desc: "Double-click a row for its price scenarios — every price the item has sold at, each costed out at the current ad days, with one click to apply. The calculator beside it prices something that isn't in the list; it reports back but writes nothing to the grid. The strip along the top is what the fit is standing on: regular retail, 90-day units, days active, and how many price points there are.",
    },
    {
      term: "AD badge",
      desc: "The item came off an uploaded ad list. Its ad retail is used as the forecast price, and that price is treated as a real price point when the curve is fitted, even though the item may never have sold at it.",
    },
    {
      term: "1pt badge",
      desc: "One price point in 90 days. There is no curve to fit, so the forecast is that single point projected forward — the price can't be changed and the popup won't open.",
    },
    {
      term: "No sales history",
      desc: "UPCs the stores returned nothing for. Usually items new to the store, discontinued, or a bad UPC on the ad list. They export as their own list from the download button.",
    },
    {
      term: "Export",
      desc: "Presets download whole datasets — selected items, all items, or the no-history list — and tick more than one to get a file each. Custom picks the columns and previews them first. Both open scoped to the bands you had on screen, and both let you change that. Rows export in rank order carrying their rank, band and share, so the CSV keeps the ordering's meaning.",
    },
  ],
};
