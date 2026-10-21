import type { HelpContent } from "../helpTypes";

/** Help for Sales Tracker — sub-department sales, week by week, against the
 *  same weeks a year ago. */
export const SALES_TRACKER_HELP: HelpContent = {
  screen: "Sales Tracker",
  purpose:
    "Sub-department sales week by week against the same weeks last year, with holidays matched to the real holiday date rather than the same calendar day.",

  guides: [
    {
      id: "start",
      title: "Track a store or group",
      desc: "A scope, an end date, and how far back to go",
      steps: [
        {
          title: "Pick the scope and the end date",
          pre: "Choose a store or a group, then set the end date — the window counts back from it.",
          anchor: "scope",
        },
        {
          title: "Say how far back",
          pre: "Use the end date with a preset —",
          chip: "12 wks",
          post: "— or set the start date yourself. Four, eight, twelve and twenty-six weeks are offered because they are the windows people actually ask for.",
        },
        {
          title: "Load it",
          pre: "Press",
          chip: "Load Tracker",
          post: ".",
          see: "Sub departments on the left, ranked by the size of their change, and the weeks for whichever one is selected on the right.",
        },
      ],
      issues: [
        {
          q: "It says no sub-department sales came back",
          a: "That store or group had no sales in the period at all. Check the end date first — a window that runs past the last day of data comes back empty rather than short.",
        },
        {
          q: "It is taking a long time",
          a: "Cost grows with stores multiplied by days, not with the size of the answer. A large group over twenty-six weeks is a lot of both. Narrow the window or the group and it returns quickly.",
        },
      ],
    },
    {
      id: "read",
      title: "Read a sub department week by week",
      desc: "Pick one on the left, read its weeks on the right",
      steps: [
        {
          title: "Open the list",
          pre: "The left panel opens ranked by the size of the change rather than by department number, so the thing worth looking at is already at the top. Sort any column to change that, or narrow with",
          chip: "Filter sub depts…",
          post: ".",
          anchor: "sub-filter",
        },
        {
          title: "Pick one",
          pre: "Click a row. The totals row at the foot is the whole scope, so leaving nothing selected reads every department together.",
          anchor: "columns",
          see: "A card per week on the right, oldest first.",
        },
        {
          title: "Open a week",
          pre: "Each card opens to the days inside it. Use",
          chip: "Expand all",
          post: "to open every week at once.",
          anchor: "weeks",
        },
      ],
      issues: [
        {
          q: "A week shows no comparison",
          a: "There was nothing on file for the matching week a year ago — a store that had not opened yet, or a gap in the history. Nothing to be above is not a rise, so the week is left blank rather than scored as growth.",
        },
      ],
    },
    {
      id: "window",
      title: "Change the window without searching again",
      desc: "Add or drop a week in place",
      steps: [
        {
          title: "Add a week further back",
          pre: "The plus in the header extends the window one week at a time, and only the week being added is fetched.",
          anchor: "window",
        },
        {
          title: "Drop the oldest",
          pre: "The minus narrows it. The rows stay held, so a week taken off and put back costs nothing.",
          anchor: "window",
        },
      ],
    },
    {
      id: "export",
      title: "Export what you are reading",
      desc: "The selected department, every week in the window",
      steps: [
        {
          title: "Pick the department first",
          pre: "The export follows the selection, so choose the department — or leave it on the total — before you export.",
          anchor: "sub-filter",
        },
        {
          title: "Export",
          pre: "Press the download arrow in the detail header.",
          chip: "Export CSV",
          anchor: "export",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "no-comparison",
      title: "A week has no comparison figure",
      questions: [
        {
          id: "q-when",
          title: "Is it missing on every week, or only some?",
          options: [
            { label: "Every week", next: "q-scope" },
            { label: "Only some weeks", result: "r-gaps" },
          ],
        },
        {
          id: "q-scope",
          title: "How old is the store or group?",
          options: [
            { label: "Open less than a year", result: "r-new-store" },
            { label: "Open longer than that", result: "r-check-basis" },
          ],
        },
      ],
      results: [
        {
          id: "r-gaps",
          badge: "Expected",
          tone: "ok",
          title: "Those weeks have nothing on file a year ago",
          why: "A comparison needs a matched week in the history. Where there is none, the tracker leaves the figure blank instead of treating zero as a result — with nothing to be above, a rise is not a rise.",
          todo: [
            "Read the weeks that do have a comparison and ignore the blanks.",
            "If the gap looks wrong for a store that was trading, raise it — missing history is a data question, not a tracker one.",
          ],
        },
        {
          id: "r-new-store",
          badge: "Expected",
          tone: "ok",
          title: "There is no last year for this store yet",
          why: "The store was not trading for the weeks being compared against, so every comparison column is empty.",
          todo: [
            "Compare against last week instead, which only needs seven days of history.",
          ],
        },
        {
          id: "r-check-basis",
          badge: "Look closer",
          tone: "warn",
          title: "The history should be there",
          why: "A store trading more than a year with no comparison on any week usually means the sales for that period did not land, rather than that the tracker could not pair them.",
          todo: [
            "Check the same period on the Sales page — if it is empty there too, it is the data.",
            "If Sales has the weeks and the tracker does not, raise it.",
          ],
        },
      ],
    },
  ],

  terms: [
    {
      term: "TY Sales",
      def: "This year. Sales for the week as it is being reported now.",
      anchor: "columns",
    },
    {
      term: "LY Sales",
      def: "Last year. The same week a year ago, with each day paired individually rather than the whole week shifted — so a holiday compares against the holiday, not against whatever fell on that date.",
      anchor: "columns",
    },
    {
      term: "LW Sales",
      def: "Last week. The seven days immediately before, for when last year is too far away to be the useful question.",
      anchor: "columns",
    },
    {
      term: "ATS",
      def: "Average transaction size — sales divided by the number of transactions that carried them.",
      anchor: "columns",
    },
    {
      term: "day matched",
      def: "A day paired to its own partner in the comparison period rather than to the same calendar date. It is what keeps a holiday comparing against the holiday.",
    },
    {
      term: "Ranked by size of change",
      def: "The opening order of the list: largest movement first, in either direction, rather than department number. A department that barely moved is not the one you came to look at.",
      anchor: "sub-filter",
    },
  ],

  contact:
    "Still stuck? Raise a ticket from the Client Help Desk and say which store and which weeks.",
};
