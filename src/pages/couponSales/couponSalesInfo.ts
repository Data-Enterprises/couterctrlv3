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

/** The mobile "?" sheet. Mobile Coupon Sales has no grading, Trend/Avg $
 *  toggle or threshold, so it gets its own copy rather than the desktop one. */
export const COUPON_SALES_MOBILE_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Coupon Sales",
  purpose:
    "Coupon dollars for the week you searched, next to the same stores' and cashiers' own prior two weeks, down to the receipt. Nothing is graded: the two sit side by side and you draw the conclusion.",
  glossary: [
    {
      term: "The big number",
      desc: "Coupon dollars for whatever is in view — the whole week or the day you've tapped, for the store, cashier and coupon type you have open.",
    },
    {
      term: "WK / AVG",
      desc: "WK is the week you searched. AVG is the two weeks before it, added up and halved into one week's worth. With a day picked, AVG is that weekday in those two weeks, halved — so a Saturday is compared with an average Saturday.",
    },
    {
      term: "Coupon types",
      desc: "Swipe the card, or use the arrows under it, to narrow the whole screen to one type. The first card is every type at once. Busiest is the day of the week with the most coupon dollars for that card's type.",
    },
    {
      term: "Coupons / Transactions",
      desc: "Coupons is the number of coupon lines. Transactions is the number of sales with at least one coupon on them. Per txn is coupon dollars divided by transactions.",
    },
    {
      term: "Tap a day",
      desc: "Scopes the card and the lists to that day. Tap it again for the full week.",
    },
    {
      term: "Stores, cashiers, transactions",
      desc: "Tap a store to see its cashiers, a cashier to see their transactions, and a transaction to open its coupon lines. Back steps up one level. A single-store search starts at Cashiers.",
    },
    {
      term: "Sort by",
      desc: "Amount and Transactions put the biggest first. vs Avg puts the biggest rise in dollars over AVG first — the most extra coupon money, not the biggest percentage. Store # and Name sort in order. Stores and Cashiers each remember their own sort.",
    },
    {
      term: "Transactions list",
      desc: "Newest first. Search it by sale ID, cashier or lane.",
    },
  ],
};
