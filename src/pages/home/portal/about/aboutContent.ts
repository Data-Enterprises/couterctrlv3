import integratedPos from "../../../../assets/portal/integrated-pos.webp";

/** About panel copy, lifted verbatim from the design handoff.
 *
 *  Separated from the component so the marketing text can be edited — or later
 *  swapped for a CMS fetch — without touching layout. */

export interface AboutItem {
  term: string;
  desc: string;
  /** Renders with the green rail + tint. Only "Validate" carries it, because
   *  it is the step the handoff calls out as the one most vendors skip. */
  key?: boolean;
}

export type AboutListKind = "plain" | "numbered";

export interface AboutSection {
  id: string;
  kicker: string;
  heading: string;
  paras: string[];
  listKind?: AboutListKind;
  items?: AboutItem[];
  image?: { src: string; alt: string };
}

export const ABOUT_MISSION = {
  kicker: "Our mission",
  lead: "To simplify retail operations by transforming data into ",
  emphasis: "actionable intelligence",
  tail: " that helps our customers make better decisions every day.",
};

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    id: "what",
    kicker: "What CounterCtrl Cloud is",
    heading: "Five modules. One set of definitions.",
    paras: [
      "Most operators aren't short on data — they're short on agreement about what it means. POS says one thing, ERP another, DSD receiving a third. CounterCtrl connects to those systems, normalizes them against a single set of definitions, and surfaces the result across five modules, so a number means the same thing on every screen.",
    ],
    listKind: "plain",
    items: [
      { term: "Sales", desc: "Store, department and item performance, with this week, last week and last year built into every view." },
      { term: "Loss Prevention", desc: "Register activity analyzed at item and cashier level, surfacing patterns instead of listing exceptions." },
      { term: "Orders", desc: "What was ordered against what actually arrived, with the variance surfaced rather than discovered later." },
      { term: "Weekly Performance", desc: "The rhythm your team already runs — without the hours of assembly that precede the meeting." },
      { term: "Coupons", desc: "Redemption reconciled against real unit movement, so a promotion's impact is visible rather than assumed." },
    ],
  },
  {
    // Was carousel slide 4 until the Aug 2026 revision cut the carousel to
    // four. The argument survives here, where there is room for it.
    id: "depth",
    kicker: "How far it goes",
    heading: "From the whole week to a single receipt.",
    paras: [
      "Start wide and keep going. Every view drills to the next level without a new report, a new export or a call to IT — and whatever you land on can be sent to the person who needs it.",
      "A district manager opens the week, sees one store off pace, opens the store, sees one category, opens the category, sees the item — without leaving the screen or asking anyone to pull a report.",
    ],
  },
  {
    id: "data",
    kicker: "Getting your data in",
    heading: "Two ways in, depending on your POS.",
    paras: [
      "CounterCtrl is built by DCR POS, so DCR sites get the deepest path: an integrated pipeline that feeds sales transactions, item and inventory, cashier metrics and operational data straight into the platform — live, with no manual step and no export to schedule.",
      "If you run something else, that's fine. We already operate a range of ingestion pipelines and file formats for raw POS data, so the platform reads what your systems produce today rather than asking you to change them.",
    ],
    image: { src: integratedPos, alt: "Integrated POS pipeline feeding CounterCtrl Cloud" },
    listKind: "plain",
    items: [
      { term: "Integrated · DCR", desc: "Live ingestion, zero-touch synchronization, built to scale." },
      { term: "Other POS", desc: "Established pipelines and formats for raw POS data, running in production today." },
      { term: "Either way", desc: "No new hardware in store, and no rip-and-replace of systems that already work." },
    ],
  },
  {
    id: "who",
    kicker: "Who we are",
    heading: "We come from the store, not the software industry.",
    paras: [
      "DCR POS has spent years inside regional grocery and retail operations — point of sale, back office, and the daily reality of running stores. CounterCtrl Cloud came out of that work rather than a whiteboard.",
      "Software built for an industry from the outside tends to solve the version of the problem that looks clean in a slide deck. Software built alongside the people running stores gets shaped by the actual friction — mismatched report formats, numbers that don't agree, the exception list nobody has time to read.",
    ],
  },
  {
    id: "how",
    kicker: "How we work",
    heading: "Three principles we hold ourselves to.",
    paras: [],
    listKind: "numbered",
    items: [
      { term: "Let Data Lead", desc: "Data is only useful when it's trustworthy enough to act on without a second opinion." },
      { term: "Keep It Simple", desc: "We built a screen with thirty filters and cut it to six. The default has to work for the person with the least time." },
      { term: "Customer First", desc: "An operator asked us to rename one column because our label didn't match theirs. We shipped it that cycle." },
    ],
  },
  {
    id: "start",
    kicker: "Getting started",
    heading: "Trust first, features second.",
    paras: [],
    listKind: "numbered",
    items: [
      { term: "Connect", desc: "To the data you already produce — POS, ERP, inventory, DSD receiving. No new hardware." },
      { term: "Validate", desc: "We match our numbers against yours until they agree. The step most vendors skip.", key: true },
      { term: "Train", desc: "On the handful of screens your team opens every morning, not every feature." },
      { term: "Tune", desc: "We keep adjusting it with you after go-live." },
    ],
  },
];

/* DEV: founding year, HQ and leadership were deliberately omitted from the
   handoff — no source. Add them here if they should be public. */
export const ABOUT_FACTS = [
  { k: "Company", v: "DCR POS · A Data Enterprises Company" },
  { k: "Built for", v: "Regional grocery & retail operators" },
  { k: "Status", v: "In production, onboarding more locations" },
];

export const ABOUT_FOOTER = "© 2026 DCR POS · A Data Enterprises Company";
