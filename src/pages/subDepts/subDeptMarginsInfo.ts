import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const SUB_DEPT_MARGINS_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Sub Dept Margins",
  purpose: "Shows which sub departments and items are losing margin, so you can catch pricing, cost, or volume problems before they add up.",
  glossary: [
    { term: "Margin", desc: "Sales minus cost of goods, as a percentage of sales. It's gross margin, not full take-home profit — other costs like cost fees aren't subtracted from it." },
    { term: "Critical / Watch / Healthy", desc: "Compared to last year first; only falls back to last week if there's no data from last year yet." },
    { term: "Avg margin % (left panel header)", desc: "A straight average of each sub department's own margin, not weighted by sales. A handful of small departments looking fine doesn't mean your biggest sellers agree." },
    { term: "No Cost tab", desc: "Items with no usable cost data at all, so their margin can't be calculated. Pulled out here instead of quietly showing as 0%, which would look like break-even rather than \"unknown.\"" },
    { term: "Ungraded (Items tab)", desc: "No comparison data from last year or last week yet for this item, so it can't be graded either way." },
    { term: "COGS", desc: "Colored in reverse from other numbers: a COGS increase is flagged as bad, since rising cost eats into margin, even though the number itself is going up." },
    { term: "Contribution %", desc: "How much of the sub department's total sales this one item makes up, not the item's own change over time." },
  ],
};
