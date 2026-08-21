import { INVESTIGATE_PCT, WATCH_PCT, MIN_LATEST } from "./lpActionsMetrics";

/** Content for the page's `?` popover. Kept beside the rule it explains so the
 *  two can't drift — the thresholds are imported, not retyped. */
export const LP_ACTIONS_INFO = {
  title: "LP Actions",
  purpose:
    "Every exception type at a store, judged against its own recent history rather than against other stores. The question is what changed, not what is highest — a lane that always voids eleven times a week is not news, and one that jumped from four to forty is.",
  glossary: [
    {
      term: "Investigate",
      desc: `The most recent week is at least ${INVESTIGATE_PCT}% above the average of the weeks before it, or the exception appeared at real volume with no history behind it.`,
    },
    {
      term: "Watch",
      desc: `Up between ${WATCH_PCT}% and ${INVESTIGATE_PCT}% on its own baseline. Worth a second week before acting.`,
    },
    {
      term: "Steady",
      desc: `Flat, down, or too thin to read. Anything under ${MIN_LATEST} occurrences in the latest week is left here on purpose: two becoming six is a big percentage and no information.`,
    },
    {
      term: "Baseline",
      desc: "The mean per week across every week except the latest. Adding a week widens it, so a spike can be downgraded once there is more history to compare against — that is the point of asking for more.",
    },
    {
      term: "Cashiers",
      desc: "Ordered by how far each moved against their own weekly normal, not by who rang the most. The busiest operator is usually the one with the most of everything.",
    },
  ],
};
