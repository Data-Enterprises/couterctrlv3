import type { InfoGlossaryEntry } from "../../../../components/InfoPopover";

/**
 * What the charts mean, moved off the page and behind a "?".
 *
 * The captions these replace were narrating the axis on every render — the
 * dates, the stacking, the shading — to a reader who needs that once. Copy
 * that only earns its place the first time someone sees a chart belongs in a
 * tooltip, not under the title.
 *
 * Deliberately no dates in here. The header already carries the period, and
 * repeating it under every chart was the noisiest part of what came out.
 *
 * Both charts cover the same span — every week that was walked — so they can
 * be read side by side without anyone checking whether they mean the same
 * period. A per-shift view of the latest week alone used to sit beside them
 * and quietly broke that.
 */
export const HOUR_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "By hour of day",
  purpose:
    "When in the trading day the exceptions land. Built from the receipt lines, which are the only place a time exists.",
  glossary: [
    {
      term: "Trading hours only",
      desc: "The axis is trimmed to the hours that actually rang, rather than padded out to a full day.",
    },
    {
      term: "Why it can lag",
      desc: "This is the one chart here that waits on a read; the other two come from figures already in hand.",
    },
  ],
};

export const DOW_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "By day of week",
  purpose:
    "Every week that was walked, folded onto a single seven-day shape — a habit shows here where one week cannot.",
  glossary: [
    {
      term: "All weeks together",
      desc: "Every week that was walked, not just the latest — which is what lets a recurring day show up as one.",
    },
    {
      term: "Shaded column",
      desc: "The day you have picked. Clicking one cuts the hour chart beside it to that day; clicking it again clears.",
    },
  ],
};
