/** Content for the Perspectives strip + slide-over.
 *
 *  Ported from perspectives.json (v1.0, 2026-08-04), which was itself extracted
 *  from the static index-story.html so it matches the rendered build. Kept
 *  beside the panel rather than inside it, same as aboutContent.ts, so copy can
 *  be edited without touching layout.
 *
 *  PERSPECTIVES-IMPLEMENTATION.md §3: the three strip labels and the three
 *  panel questions are a matched pair — the visitor clicks "I run a store" and
 *  lands on "If I am a store manager…". Edit one, edit the other.
 *
 *  §4: the feature-to-role mapping is inferred from existing product copy, not
 *  supplied by product. Confirm before this is treated as final.
 */

export type SeatId = "exec" | "dept" | "ops";

export interface PerspectiveItem {
  title: string;
  body: string;
}

export interface PerspectiveGroup {
  /** Null on the Owner seat — one ungrouped list, no sub-heading. */
  role: string | null;
  items: PerspectiveItem[];
}

export interface PerspectiveSeat {
  id: SeatId;
  /** URL segment for the generated SEO page. Lives here rather than in
   *  scripts/build-static-pages.mjs so the page and the panel can never
   *  disagree about which seat is which. */
  slug: string;
  tabLabel: string;
  eyebrow: string;
  /** The headline, phrased as the question the visitor is asking. */
  question: string;
  answer: string;
  groups: PerspectiveGroup[];
  where: string[];
  next: { text: string; action: "open_about" | "open_walkthrough" };
}

export const PERSPECTIVES_PANEL = {
  kicker: "CounterCtrl Cloud",
  title: "Perspectives",
  /** Split three ways for the same reason MISSION is: the rendered build bolds
   *  the middle clause, and the JSON carries it as one flat string. */
  lead: "Everyone works from the same nightly load. What changes is ",
  leadEmphasis: "the reach your role covers",
  leadTail:
    " and the screen you open first. Pick the seat closest to yours and see what you would actually get.",
  footer: "Same numbers · different reach",
};

/** Deliberately not in seat order. The pills read as the visitor would say it
 *  out loud; the tabs read as the org chart. "I run a store" is second here and
 *  opens the third tab. */
export const PERSPECTIVES_STRIP: {
  labelFull: string;
  labelShort: string;
  buttons: { id: SeatId; label: string }[];
} = {
  labelFull: "See CounterCtrl Cloud your way",
  labelShort: "See it your way",
  buttons: [
    { id: "exec", label: "I own the business" },
    { id: "ops", label: "I run a store" },
    { id: "dept", label: "I’m in a department" },
  ],
};

export const PERSPECTIVE_SEATS: PerspectiveSeat[] = [
  {
    id: "exec",
    slug: "owner-c-suite",
    tabLabel: "Owner & C-suite",
    eyebrow: "Owner · Executive · C-suite",
    question: "If I am a business owner, what does CounterCtrl Cloud provide me?",
    answer:
      "A short list, every morning, of the places your group broke pattern — with every number meaning the same thing whether it came from one store or all of them. You are not looking for a report. You are looking for the handful of things worth a phone call.",
    groups: [
      {
        role: null,
        items: [
          {
            title: "Group rollup",
            body: "Every banner and every location in one view, reading from one definition set, so no one arrives at the meeting with a different version of the same number.",
          },
          {
            title: "Graded, not listed",
            body: "Locations sort into what needs attention, what to keep an eye on, and what is fine — against thresholds you set, not a vendor's defaults.",
          },
          {
            title: "Comparison built in",
            body: "This week, last week and last year travel with every number, so the context does not have to be assembled.",
          },
          {
            title: "Straight to the receipt",
            body: "Any number opens to the next level down — banner to district to store to category to item — without a new report or a call to IT.",
          },
        ],
      },
    ],
    where: ["In the office", "On the go"],
    next: {
      text: "Want the mechanics? Read how the data gets there →",
      action: "open_about",
    },
  },
  {
    id: "dept",
    slug: "departments",
    tabLabel: "Departments",
    eyebrow: "Loss Prevention · Operations · Marketing · Pricing",
    question: "If I am in a department, what does CounterCtrl Cloud provide me?",
    answer:
      "The answer to your own question, on your own schedule, without filing a request and waiting on somebody else to assemble it. Each department owns a different slice of the same nightly load — the screens differ, the definitions underneath them do not.",
    groups: [
      {
        role: "If I am in Loss Prevention",
        items: [
          {
            title: "Register activity at item and cashier level",
            body: "Voids, refunds, discounts and no-sales read as patterns rather than a list of every exception in the chain.",
          },
          {
            title: "Ranked by exposure",
            body: "The biggest problems surface first instead of the most frequent ones.",
          },
        ],
      },
      {
        role: "If I am in Operations",
        items: [
          {
            title: "Ordered against arrived",
            body: "Receiving and DSD variance shows up as a number the same night, not as a surprise found weeks later.",
          },
          {
            title: "Store and department performance",
            body: "Where the operating rhythm is holding and where it is not, location by location.",
          },
        ],
      },
      {
        role: "If I am in Marketing",
        items: [
          {
            title: "Coupons against real movement",
            body: "Redemption reconciled to actual unit movement, so a promotion's impact is measured instead of assumed.",
          },
          {
            title: "Category and item response",
            body: "What the promotion moved, where it moved, and what it moved instead.",
          },
        ],
      },
      {
        role: "If I am in Pricing",
        items: [
          {
            title: "UPC Search & Analysis",
            body: "Follow one item wherever it goes — movement, margin, price changes and promotions across every store.",
          },
          {
            title: "Margin where it moved",
            body: "See the price change and the unit response side by side rather than in two exports.",
          },
        ],
      },
    ],
    where: ["In the office", "On the go"],
    next: {
      text: "The five modules in full: About CounterCtrl Cloud →",
      action: "open_about",
    },
  },
  {
    id: "ops",
    slug: "operators",
    tabLabel: "Operators",
    eyebrow: "District · Regional · Store & Department Managers · Coordinators",
    question: "If I am a store manager, what does CounterCtrl Cloud provide me?",
    answer:
      "Yesterday’s numbers, already graded, before the doors open — scoped to exactly what you are responsible for and nothing else. Closest to the shelf, shortest window to act on what you find.",
    groups: [
      {
        role: "If I cover a district or region",
        items: [
          {
            title: "Your stores at a glance",
            body: "Every location you cover, graded, so the one that is off pace is the one you open.",
          },
          {
            title: "One click deeper",
            body: "Store to category to item without leaving the screen or asking anyone to pull a report.",
          },
        ],
      },
      {
        role: "If I run a store or a department",
        items: [
          {
            title: "Overnight sales, already graded",
            body: "Yesterday by department, with last week and last year attached, ready before the shift starts.",
          },
          {
            title: "Scoped to your aisle",
            body: "A department manager sees their department. Permissions decide the reach, so nobody wades through someone else's numbers.",
          },
        ],
      },
      {
        role: "If I coordinate pricing, receiving or customer service",
        items: [
          {
            title: "The item or the delivery you own",
            body: "Look up a UPC, check what arrived against what was ordered, and see the answer on the spot.",
          },
          {
            title: "Send it on",
            body: "Whatever you land on can go to the person who needs it, as it is.",
          },
        ],
      },
    ],
    where: ["In the store", "On the go", "In the office"],
    next: {
      text: "Reading about it only goes so far. Book a walkthrough →",
      action: "open_walkthrough",
    },
  },
];
