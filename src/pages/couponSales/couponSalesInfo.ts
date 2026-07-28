import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const COUPON_SALES_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Coupon Sales",
  purpose:
    "Flags where coupons are coming off unusually large, so you can trace an inflated average down to the sub department, day, or cashier behind it and read the actual transactions.",
  glossary: [
    {
      term: "Avg coupon",
      desc: "Total coupon dollars divided by the number of coupon lines — the value of a typical single coupon. This is the graded number at every level of the page.",
    },
    {
      term: "Critical / OK",
      desc: "Critical means the average coupon is above the threshold. There's no middle tier here: a dollar figure is either over the line or it isn't.",
    },
    {
      term: "Threshold",
      desc: "A flat dollar amount, not a percentage. Nothing is compared to last week or last year — this grades the range you searched on its own, as an outlier check rather than a trend.",
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
      term: "Sub Dept / Date / Cashier",
      desc: "Three ways to break down the same selected store. All three are graded against the same threshold, so a critical row means the same thing whichever tab you're on.",
    },
  ],
};
