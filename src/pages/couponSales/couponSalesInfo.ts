import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const COUPON_SALES_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Coupon Sales",
  purpose:
    "Flags where coupons are coming off unusually large — either because a store has moved against its own recent norm, or because its average is simply high — so you can trace it down to the sub department, cashier or day behind it and read the actual transactions.",
  glossary: [
    {
      term: "Avg coupon",
      desc: "Total coupon dollars divided by the number of coupon lines — the value of a typical single coupon. This is the graded number at every level of the page.",
    },
    {
      term: "Trend vs Avg $",
      desc: "Two different questions, so the toggle picks one. Trend compares this week's average against the same store's prior two weeks. Avg $ ignores history and compares the average to a flat dollar line. A store steady at $8 for months is invisible to Trend and obvious to Avg $; a store moving $1 to $2 is the reverse.",
    },
    {
      term: "Baseline",
      desc: "The two weeks before the searched week. Both weeks pool into one average rather than averaging two weekly averages, so a quiet week doesn't carry the same weight as a busy one. Nothing is halved: an average is already per-coupon, so two weeks compare directly against one.",
    },
    {
      term: "Threshold",
      desc: "Follows the toggle. Under Trend it's the percentage rise that tips a row into critical; under Avg $ it's the dollar amount the average has to clear. The two are stored separately, so switching back and forth keeps both.",
    },
    {
      term: "Grades",
      desc: "Under Trend: Critical is above the percentage threshold, Watch is up but under it, OK is flat or down, and Ungraded means the group had no coupons in the baseline weeks — unknown, not healthy. Under Avg $ there are only two: over the dollar line or not.",
    },
    {
      term: "Day of week",
      desc: "Each day's average coupon against the same weekday in the baseline weeks — this Tuesday against those Tuesdays. Selecting a day narrows the KPIs, the breakdown rows and the transactions together.",
    },
    {
      term: "Coupons",
      desc: "The number of coupons used — the count of coupon lines, and the denominator behind the average. Item quantity isn't shown because coupon lines don't reliably carry one.",
    },
    {
      term: "Trans",
      desc: "Distinct transactions containing at least one coupon. Shown for context — it is never the denominator behind the average.",
    },
    {
      term: "Sub Dept / Cashier",
      desc: "Two ways to break down the selected store, both graded the same way the store rows are, against that store's own baseline. Individual transactions are the exception: a single sale has no history to move against, so it is always judged on the dollar rule.",
    },
  ],
};
