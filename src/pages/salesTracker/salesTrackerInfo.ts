import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const SALES_TRACKER_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Sales Tracker",
  purpose:
    "Tracks each sub department against the same weeks last year, then lets you open a week and see the days inside it.",
  glossary: [
    {
      term: "TY / LY Sales",
      desc: "Net sales for the window you searched, and for the matching window last year. Both are after tax, so the two sides are counted the same way.",
    },
    {
      term: "ATS Sales",
      desc: "Average Transaction Size — sales divided by the number of transactions that included this department. It answers whether a change came from more baskets or bigger ones.",
    },
    {
      term: "$ vs LY / % vs LY",
      desc: "How far ahead or behind last year this department is. Green is up, red is down. There's no threshold here — the tracker reports the movement, it doesn't rank how serious it is.",
    },
    {
      term: "Matching last year",
      desc: "Every day is compared to the same weekday last year, not the same calendar date, so a Saturday is always measured against a Saturday. Holidays are matched to the real holiday instead.",
    },
    {
      term: "Weeks with no comparison",
      desc: "Where last year has no matching day at all, the comparison shows a dash rather than a zero — and those days are left out of the totals on both sides, so a partial history doesn't read as a collapse.",
    },
    {
      term: "Holiday star",
      desc: "Marks a day whose match last year is shared with another day, which happens when a holiday moves. The comparison for those days counts the same last-year day twice, so it's flagged rather than hidden.",
    },
    {
      term: "No sales recorded",
      desc: "No rows came back for that day at all. Usually the store was closed; occasionally it means the day never made it into the data.",
    },
  ],
};
