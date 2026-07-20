import type { UpcDevTab } from "../../../features/upcDevSlice";
import type { InfoGlossaryEntry } from "../../../components/InfoPopover";

export type ModuleInfo = {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
};

export const MODULE_INFO: Partial<Record<UpcDevTab, ModuleInfo>> = {
  salesComp: {
    title: "Sales Comp",
    purpose: "Compares this year's sales to last year and recent weeks, to catch items underperforming their own history.",
    glossary: [
      { term: "Peak day", desc: "The day generating the most dollars across your selection — not just the most common peak day per item, those can disagree, and we show both." },
      { term: "Avg daily / UPC", desc: "Average per active-selling day; days with zero sales aren't counted." },
      { term: "WoW trend", desc: "Compares each item's most recent complete week against the average of all complete weeks in range, not last week vs. the week before." },
      {
        term: "Heatmap",
        desc: "Cell color reflects average daily sales for that day-of-week.",
        subEntries: [
          { label: "Global scale", desc: "Colored against the highest day-value across your entire selection, so colors are comparable row to row." },
          { label: "Per item scale", desc: "Colored against each UPC's own peak day, so its own weekly pattern shows clearly regardless of size." },
        ],
      },
      { term: "LY row", desc: "Shown when a product's expanded — same calendar weeks, one year back." },
    ],
  },
  priceOpt: {
    title: "Price Opt",
    purpose: "Checks whether an item's current price is actually costing you profit, based on what price performed best historically.",
    glossary: [
      { term: "Best price", desc: "The price point that generated the most total profit historically once your cost is known — not necessarily the one with the most revenue." },
      { term: "Profit at risk", desc: "Estimated dollars left on the table by staying at the current price instead of the best one, using historical quantity at each price as the estimate." },
      { term: "Units suppressed", desc: "Estimated units lost to being priced above the best price." },
      { term: "Elasticity", desc: "How much demand shifts with price; more negative means more price-sensitive." },
      { term: "Group searches", desc: "Show historical pricing only until you pick a store — needed to know your cost." },
    ],
  },
  trend: {
    title: "Trend",
    purpose: "Flags items whose daily sales pattern is meaningfully shifting, and tries to tell you whether that's really about demand or just about the item not being stocked.",
    glossary: [
      { term: "Reduced availability", desc: "Total volume dropped, but the daily rate held or improved — usually a stocking issue, not weaker demand." },
      { term: "Declining", desc: "Total volume and daily rate both dropped — a real demand decline." },
      { term: "Accelerating", desc: "A declining item where the rate of decline is getting worse." },
      { term: "Confidence", desc: "How reliable the trend estimate is; higher means the pattern is consistent, not noise." },
    ],
  },
  association: {
    title: "Association",
    purpose: "Shows what else gets bought alongside your selected items, for cross-merchandising or understanding a purchase pattern.",
    glossary: [
      { term: "Main → Level 1 → Level 2 → Level 3", desc: "Each level shows what's commonly bought with whatever's checked in the level before it; caps at 3 levels deep." },
      { term: "UPC Search", desc: "Look up any single item's associations directly; also reachable by right-clicking any item anywhere." },
    ],
  },
};
