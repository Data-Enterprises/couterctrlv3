import type { InfoGlossaryEntry } from "../../../components/InfoPopover";

export const SUB_DEPT_MARGINS_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Sub Dept Margins",
  purpose: "Shows which sub departments and items are losing margin, so you can catch pricing, cost, or volume problems before they add up.",
  glossary: [
    { term: "Margin", desc: "Sales minus cost of goods, as a percentage of sales. It's gross margin, not full take-home profit — other costs like cost fees aren't subtracted from it." },
    { term: "Cost of goods", desc: "The cost actually paid after any vendor allowance, not the list price on the invoice — and pounds rather than scans on anything sold by weight. Categories and Item Lookup use the same figure, so all three pages agree on the same item and day." },
    { term: "Critical / Watch / Healthy", desc: "Graded against last year, but only when last year has every day of the week. If it's missing days, the grade uses last week instead. Critical means down more than your threshold; Watch means down some, but not past it; Healthy means flat or up." },
    { term: "Grey percentages", desc: "That comparison is missing days — for example, last year only has 3 of the 7 days. The number is still shown, but it isn't used for the grade, because a partial week can't fairly call a sub department Critical. The header pills go grey the same way and show how many days matched." },
    { term: "Not graded (grey dot)", desc: "Neither last week nor last year has every day of the week, so there's no full-week comparison to grade on. These aren't counted under Critical, Watch or Healthy." },
    { term: "Avg margin % (left panel header)", desc: "A straight average of each sub department's own margin, not weighted by sales. A handful of small departments looking fine doesn't mean your biggest sellers agree." },
    { term: "No Cost tab", desc: "Items with no usable cost data at all, so their margin can't be calculated. Pulled out here instead of quietly showing as 0%, which would look like break-even rather than \"unknown.\"" },
    { term: "Ungraded (Items tab)", desc: "No full-week comparison for this item — last year and last week are both missing days, or have no sales for it — so it can't be graded either way." },
    { term: "COGS", desc: "Colored in reverse from other numbers: a COGS increase is flagged as bad, since rising cost eats into margin, even though the number itself is going up." },
    { term: "Contribution %", desc: "How much of the sub department's total sales this one item makes up, not the item's own change over time." },
  ],
};
