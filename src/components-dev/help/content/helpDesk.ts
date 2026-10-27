import type { HelpContent } from "../helpTypes";

/** Help for the Client Help Desk — raising a ticket, following it, and (for
 *  support staff) working the queue. */
export const HELP_DESK_HELP: HelpContent = {
  screen: "Client Help Desk",
  purpose:
    "Raise a support ticket and follow the conversation on it without leaving CounterCtrl.",

  guides: [
    {
      id: "raise",
      title: "Raise a ticket",
      desc: "Say what happened and where",
      steps: [
        {
          title: "Start one",
          pre: "Press",
          chip: "New ticket",
          post: "under the list.",
          anchor: "new-ticket",
        },
        {
          title: "Say what is happening",
          pre: "Give it a short title — something like “Printer jam at lane 3” — and describe what you were doing when it went wrong.",
          see: "The more specific the title, the faster it reaches the right person.",
        },
        {
          title: "Say which stores",
          pre: "Tick the stores it is about, as many as it affects, or tick",
          chip: "Not about a store",
          post: "if it is about something else, like signing in. One or the other is needed to send it.",
          see: "If you have only one store, it is filled in for you.",
        },
        {
          title: "Set how urgent it is",
          pre: "Normal unless it is stopping work. Urgent is for things that cannot wait, and it is a jump to the top of the queue rather than a tone of voice.",
        },
        {
          title: "Send it",
          pre: "Press",
          chip: "Send it",
          post: ". You can attach screenshots on the way.",
          see: "The ticket appears in your list as Open.",
        },
      ],
      issues: [
        {
          q: "I was looking at a problem on another page",
          a: "Use Report an issue from the title bar instead. It raises the form over the page you are on, so you do not have to leave the evidence behind to describe it.",
        },
        {
          q: "I cannot find the store in the list",
          a: "The picker offers the stores you have access to. If one is missing, that is an access question rather than a ticket one — raise a ticket about it and say which store.",
        },
        {
          q: "Who will see my ticket?",
          a: "You, the support desk, the managers of the stores you ticked, and the owners of your company. A ticket not about a store reaches your own store's manager if you are not a manager yourself, and otherwise the owners.",
        },
      ],
    },
    {
      id: "follow",
      title: "Follow a ticket",
      desc: "Read the thread and reply",
      steps: [
        {
          title: "Open it",
          pre: "Pick it from the list on the left. The thread fills the middle and who raised it sits on the right.",
          anchor: "queue-tabs",
        },
        {
          title: "Read the status",
          pre: "Open, In progress, Waiting and Closed. Waiting means it is back with you — somebody has asked a question and the answer has not come yet.",
        },
        {
          title: "Reply",
          pre: "Type at the foot of the thread and press",
          chip: "Reply",
          post: ".",
          anchor: "reply",
          see: "Your reply joins the thread and the ticket moves back to Open.",
        },
      ],
      issues: [
        {
          q: "My ticket says Waiting and I do not know why",
          a: "Somebody has asked you something. Read the last message in the thread — Waiting always follows a question.",
        },
        {
          q: "A ticket disappeared from my list",
          a: "Usually it was closed: switch to the Closed tab to read it, since closing deletes nothing. If it is not there either, its stores changed, or yours did, and it is no longer one of the tickets you can see.",
        },
      ],
    },
    {
      id: "find",
      title: "Find a ticket again",
      desc: "Search and the tabs",
      steps: [
        {
          title: "Search",
          pre: "The box above the list searches titles and descriptions.",
          anchor: "search",
        },
        {
          title: "Or use the tabs",
          pre: "Open and Closed, so a finished ticket is still readable without cluttering the list you work from.",
          anchor: "queue-tabs",
        },
      ],
    },
    {
      id: "queue",
      title: "Work the queue",
      desc: "For support staff — the tabs, urgent, and assigning",
      steps: [
        {
          title: "Pick a pile",
          pre: "All, Unassigned, Mine and Closed. Unassigned is the one that needs somebody to take it.",
          anchor: "queue-tabs",
        },
        {
          title: "Jump to what cannot wait",
          pre: "The Urgent button beside the search box says how many and takes you to them. It only tints when there is something to see.",
          anchor: "search",
        },
        {
          title: "Narrow it",
          pre: "The status and priority pickers narrow the pile you are on, and",
          chip: "Clear narrowing",
          post: "puts it back.",
        },
        {
          title: "Correct the stores",
          pre: "If a ticket names the wrong stores, press",
          chip: "Edit stores",
          post: "under its title. The stores decide which managers see it.",
          see: "An internal note records the change in the thread.",
        },
        {
          title: "Leave an internal note",
          pre: "Tick",
          chip: "Internal note",
          post: "before posting and the client never sees it.",
          anchor: "reply",
          see: "The note sits in the thread marked as internal.",
        },
      ],
      issues: [
        {
          q: "I posted a note and the client can see it",
          a: "The tick has to be set before sending — it is not retroactive. Raise it with whoever runs the desk if something sensitive went out.",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "nothing-happening",
      title: "Nothing is happening on my ticket",
      questions: [
        {
          id: "q-status",
          title: "What does the status say?",
          options: [
            { label: "Waiting", result: "r-waiting" },
            { label: "Open", next: "q-age" },
            { label: "In progress", result: "r-in-progress" },
            { label: "Closed", result: "r-closed" },
          ],
        },
        {
          id: "q-age",
          title: "How urgent did you mark it?",
          options: [
            { label: "Urgent", result: "r-urgent" },
            { label: "Normal or lower", result: "r-normal" },
          ],
        },
      ],
      results: [
        {
          id: "r-waiting",
          badge: "With you",
          tone: "warn",
          title: "It is waiting on your answer",
          why: "Waiting always follows a question. Until it is answered the ticket sits still, because nobody can act on it.",
          todo: [
            "Read the last message in the thread.",
            "Reply, and the ticket moves back to Open on its own.",
          ],
        },
        {
          id: "r-in-progress",
          badge: "Being worked",
          tone: "ok",
          title: "Somebody has it",
          why: "In progress means a person has picked it up. The thread is where any update will appear.",
          todo: [
            "Add anything new to the thread rather than raising a second ticket — two tickets about one problem slow it down.",
          ],
        },
        {
          id: "r-closed",
          badge: "Finished",
          tone: "ok",
          title: "It was closed",
          why: "Closed tickets stay readable on the Closed tab. Nothing is deleted.",
          todo: [
            "If the problem came back, raise a new ticket and say it is a repeat — that is more useful than reopening a thread with an old answer in it.",
          ],
        },
        {
          id: "r-urgent",
          badge: "Chase it",
          tone: "bad",
          title: "Urgent should not sit",
          why: "Urgent jumps the queue, so an urgent ticket that has not moved is worth raising directly rather than waiting.",
          todo: [
            "Add a reply saying it is still stopping work — that puts it back at the top.",
            "If it is stopping trade, call it in rather than waiting on the thread.",
          ],
        },
        {
          id: "r-normal",
          badge: "In the queue",
          tone: "ok",
          title: "It is waiting its turn",
          why: "Normal tickets are worked in order behind anything urgent.",
          todo: [
            "If it has become more urgent, say so in the thread and the priority can be raised.",
          ],
        },
      ],
    },
  ],

  terms: [
    {
      term: "Open",
      def: "Raised and not yet picked up, or replied to and waiting to be looked at again.",
      anchor: "queue-tabs",
    },
    {
      term: "In progress",
      def: "Somebody has it and is working on it.",
      anchor: "queue-tabs",
    },
    {
      term: "Waiting",
      def: "Back with you. A question has been asked and the answer has not come yet — the ticket does not move until it does.",
      anchor: "queue-tabs",
    },
    {
      term: "Closed",
      def: "Finished. Still readable on the Closed tab; closing deletes nothing.",
      anchor: "queue-tabs",
    },
    {
      term: "Urgent",
      def: "It cannot wait. A jump to the front rather than a tone of voice — using it for everything is how it stops working.",
    },
    {
      term: "Internal note",
      def: "A message on the ticket that only support staff can read. The tick has to be set before posting; it is not retroactive.",
      anchor: "reply",
    },
    {
      term: "Unassigned",
      def: "In the queue with nobody's name on it. The pile that needs somebody to take it.",
      anchor: "queue-tabs",
    },
    {
      term: "Not about a store",
      def: "A ticket about something other than a store, like signing in or setting up a user. Owners see it, and so does the store manager of whoever raised it, if they are not a manager themselves.",
    },
    {
      term: "Report an issue",
      def: "The shortcut in the title bar. It raises the ticket form over the page you are on, so you can describe a problem while still looking at it.",
    },
  ],
};
