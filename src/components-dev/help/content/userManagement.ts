import type { HelpContent } from "../helpTypes";

/**
 * Help for User Management.
 *
 * Written against the dev tree as it stands: four tabs (Users, Companies,
 * Base Groups, Stores), one four-step wizard that is both Add and Edit
 * (User info -> Access type -> Assignments -> Review), and base groups built
 * on their own tab with a dual list for stores and another for people.
 *
 * The older version of this file described an edit screen of two tabs with a
 * "Save access" button, and a trash icon that deleted. Neither has existed for
 * some time: Edit is the wizard filled in, and the trash deactivates. Help
 * that names a control the reader cannot find is worse than no help, so the
 * rule here is that every `chip` is a label as the screen carries it and every
 * `anchor` is a `data-help` on this page.
 *
 * The one thing the workflow hides, and the reason three entries below keep
 * coming back to it: **a base group you create is not yours until you hold
 * it.** The groups list only shows the groups the signed-in person holds, so a
 * freshly created group vanishes until its creator grants it to themselves.
 */
export const USER_MANAGEMENT_HELP: HelpContent = {
  screen: "User Management",
  purpose:
    "Add people, and decide which stores each of them can see.",

  guides: [
    {
      id: "add",
      title: "Add a user",
      desc: "Four steps, and nothing is saved until the last one",
      steps: [
        {
          title: "Open the form",
          pre: "On the Users tab, press",
          chip: "Add user",
          post: ".",
          anchor: "filters",
        },
        {
          title: "User info",
          pre: "Role and level first — the level list stops at your own — then the name, username, email and a password typed twice. Username and email are not checked on their own: press",
          chip: "Check Availability",
          post: "beside either label, or Enter in the box.",
          see: "Available or Not available next to the label. The username can never be changed afterwards.",
          anchor: "wizard",
        },
        {
          title: "Access type",
          pre: "Choose",
          chip: "By group",
          post: "— they get every store in the base groups you pick, and a store added to one later reaches them on its own — or By store, where they get only the stores you tick.",
          see: "Which one you choose decides what the next step asks for.",
          anchor: "wizard",
        },
        {
          title: "Assignments",
          pre: "Tick the base groups they should hold. By store also wants the individual stores inside each group.",
          see: "The strip under the columns counts what you have picked, and Effective stores adds it up.",
          anchor: "wizard",
        },
        {
          title: "Review and create",
          pre: "Check the four counts, then press",
          chip: "Create user",
          post: ". This is the first moment anything is sent.",
          anchor: "wizard",
        },
      ],
      issues: [
        {
          q: "Which access type should I pick?",
          a: "By group suits managers, buyers and corporate — anyone who should follow a group as it grows. By store suits a single store or a small multi-store, where the list is deliberate and should not change on its own.",
        },
        {
          q: "Continue is greyed out on Assignments",
          a: "A group is held By store with no stores picked, and the notice under the columns names it. Pick at least one store in that group, or untick the group.",
        },
        {
          q: "It says the user was created but their access didn't finish saving",
          a: "The account exists and the access does not, so they would sign in to nothing. Press Retry access. If you leave it for now, open them from the users list and save again — do not leave somebody in that state.",
        },
      ],
    },
    {
      id: "change-access",
      title: "Change what a user can see",
      desc: "Edit is the same four steps, filled in",
      steps: [
        {
          title: "Open them",
          pre: "Press the pencil icon on their row.",
          see: "The same four steps, every one reachable from the first click. The username is fixed and there is no password box.",
          anchor: "grid",
        },
        {
          title: "Change the type, the groups, or both",
          pre: "Access type applies to the whole person: changing it rewrites every base group they hold, and the Review step says how many.",
          see: "Switching to By store starts with all their current stores ticked, so nothing is lost until you untick.",
          anchor: "wizard",
        },
        {
          title: "Save",
          pre: "Press",
          chip: "Save changes",
          post: "on the Review step. Only what you changed is sent.",
          anchor: "wizard",
        },
      ],
      issues: [
        {
          q: "Save changes stays greyed out",
          a: "Nothing has moved yet. The button lights up when a field or an assignment is different from how you found it.",
        },
        {
          q: "Their Access column says Mixed or Not set",
          a: "Mixed means their groups disagree — some automatic, some picked. Not set means they were made before access types existed. Either way, open them, choose one access type and save: it settles every group they hold.",
        },
        {
          q: "Effective stores lists a store as Direct",
          a: "It was granted on the Stores tab rather than through a group, so no group change can take it away. Remove it on the Stores tab if it should not be there.",
        },
      ],
    },
    {
      id: "copy",
      title: "Copy another user's setup",
      desc: "Access copies, identity never does",
      steps: [
        {
          title: "Duplicate them",
          pre: "Press the duplicate icon on a user's row.",
          see: "Role, level, companies, base groups, the access type and any picked stores carried into a new user. Name, username, email and password stay blank. A store granted directly does not copy — it has no group to travel in.",
          anchor: "grid",
        },
      ],
    },
    {
      id: "base-group",
      title: "Build a base group",
      desc: "Create it, hold it, fill it, hand it out",
      steps: [
        {
          title: "Open Base Groups",
          pre: "The",
          chip: "Base Groups",
          post: "tab. The list shows your companies, each opening to the groups you hold.",
          anchor: "tabs",
        },
        {
          title: "Create it",
          pre: "Press the + beside the search box, then give it a name and a company.",
          anchor: "base-groups",
        },
        {
          title: "Give it to yourself",
          pre: "Go to Users, open your own row, and tick the new group on Assignments.",
          see: "The group appears in the Base Groups list. Until you hold it, it is not listed and cannot be filled.",
          anchor: "grid",
        },
        {
          title: "Put the stores in",
          pre: "Select the group, then on the",
          chip: "Stores",
          post: "sub-tab pick from the left-hand list and press Assign.",
          see: "The message says how many stores moved, how many people gained them, and how many single-store accounts were skipped.",
          anchor: "assign",
        },
        {
          title: "Put the people in",
          pre: "The",
          chip: "Users",
          post: "sub-tab, the same way. Everyone added here gets the whole group, including stores added to it later.",
          anchor: "group-tabs",
        },
      ],
      issues: [
        {
          q: "The group I just created is not in the list",
          a: "You do not hold it yet. Users → your own row → Edit → Assignments → tick it → save.",
        },
        {
          q: "A store would not move into the group",
          a: "A store can only join a group in its own company; the message names the mismatch. Check you picked the right group.",
        },
        {
          q: "It says a user has the single-store role",
          a: "This tab only ever hands over whole groups, and a single-store account cannot hold one. Give them their store through Users → Edit → By store instead.",
        },
        {
          q: "It says nobody holds this group automatically",
          a: "Everyone holding the group is By store, so a new store in it reaches none of them. Either tick the store for them individually, or move them to By group.",
        },
      ],
    },
    {
      id: "deactivate",
      title: "Switch a user off, or back on",
      desc: "Nothing is lost, and it can be undone",
      steps: [
        {
          title: "One person",
          pre: "The trash icon on their row, then confirm.",
          see: "Their companies, base groups and stores are kept, so switching them back on gives it all back.",
          anchor: "grid",
        },
        {
          title: "Several at once",
          pre: "Press",
          chip: "Deactivate users",
          post: ", tick the rows, then confirm.",
          see: "The confirmation names everybody first, then reports each one back: deactivated, already inactive, refused with a reason, or not found.",
          anchor: "filters",
        },
        {
          title: "Bring somebody back",
          pre: "Set the status filter to",
          chip: "Inactive",
          post: "and use the reactivate icon on their row.",
          anchor: "filters",
        },
      ],
      issues: [
        {
          q: "A row has no trash icon",
          a: "It is your own row. Nobody can switch themselves off.",
        },
        {
          q: "Some names came back refused",
          a: "Partial success is normal — one person outside your companies does not stop the rest. Read the reason on each row and re-run only those.",
        },
      ],
    },
    {
      id: "password",
      title: "Reset a password",
      desc: "The only place a password is set after the account exists",
      steps: [
        {
          title: "Open the row's key icon",
          pre: "Type the temporary password twice, then press Reset password.",
          see: "Reset security, beside it, makes them set a new security question at their next sign-in.",
          anchor: "grid",
        },
      ],
    },
  ],

  fixes: [
    {
      id: "cant-edit",
      title: "I can't open or change a user",
      questions: [
        {
          id: "what",
          title: "What does their row show?",
          options: [
            { label: "“Unauthorized” instead of the icons", result: "outranked" },
            { label: "They aren't in the list at all", result: "missing" },
            { label: "I can't give them the level I want", result: "level" },
          ],
        },
      ],
      results: [
        {
          id: "outranked",
          tone: "ok",
          badge: "By design",
          title: "They are above your level",
          why: "A user whose level is higher than yours cannot be opened or changed, so the row shows Unauthorized instead of the actions. The same rule keeps them out of every assign list.",
          todo: ["Ask someone at or above their level to make the change."],
        },
        {
          id: "missing",
          tone: "ok",
          badge: "By design",
          title: "You only see users who share a company with you",
          why: "The list is scoped to the companies on your own account, so somebody in a company you do not hold will not appear. Deactivated people are behind their own filter.",
          todo: [
            "Clear the company filter above the list.",
            "Set the status filter to Inactive in case they were switched off.",
            "If they should be visible, the company needs adding to their account.",
          ],
        },
        {
          id: "level",
          tone: "ok",
          badge: "By design",
          title: "You can only give out levels up to your own",
          why: "The level list stops at your own level, so nobody can create an account they would then be unable to manage.",
          todo: [],
        },
      ],
    },
    {
      id: "no-stores",
      title: "They can't see a store they should",
      questions: [
        {
          id: "mode",
          title: "What does the Access column say for them?",
          options: [
            { label: "By group", result: "by-group" },
            { label: "By store", result: "by-store" },
            { label: "Not set, or Mixed", result: "unsettled" },
          ],
        },
      ],
      results: [
        {
          id: "by-group",
          tone: "ok",
          badge: "Check the group",
          title: "They get every store in the groups they hold",
          why: "So a missing store means it is not in any group they hold — either it was never added to one, or they do not hold the group it is in.",
          todo: [
            "Open them and look at which groups are ticked on Assignments.",
            "On Base Groups, check the store is in one of those groups; add it on the Stores sub-tab if not.",
          ],
        },
        {
          id: "by-store",
          tone: "ok",
          badge: "By design",
          title: "They only have the stores that were ticked",
          why: "A By store user holds a fixed list. A store added to one of their groups afterwards does not reach them, which is the whole difference between the two access types.",
          todo: [
            "Open them, go to Assignments, and tick the store.",
            "If this keeps happening, consider moving them to By group.",
          ],
        },
        {
          id: "unsettled",
          tone: "warn",
          badge: "Needs a decision",
          title: "Their access type has not been settled",
          why: "Not set means no type was ever recorded; Mixed means their groups disagree with each other. Either way the app cannot say how they should receive new stores.",
          todo: [
            "Open them, pick an access type, and save.",
            "The save rewrites every base group they hold in that type — the Review step says how many.",
          ],
        },
      ],
    },
    {
      id: "group-missing",
      title: "A base group isn't in my list",
      questions: [
        {
          id: "when",
          title: "Did you create it yourself just now?",
          options: [
            { label: "Yes, I created it and it vanished", result: "self-assign" },
            { label: "No, somebody else set it up", result: "not-held" },
          ],
        },
      ],
      results: [
        {
          id: "self-assign",
          tone: "ok",
          badge: "One more step",
          title: "You have to hold a group before you can fill it",
          why: "The list shows the groups you hold, not every group in the company. A group you have just created belongs to nobody, including you.",
          todo: [
            "Users → your own row → Edit → Assignments.",
            "Tick the new group and save, then go back to Base Groups.",
          ],
        },
        {
          id: "not-held",
          tone: "ok",
          badge: "By design",
          title: "It is somebody else's to look after",
          why: "Holding the company is not enough: a group you do not hold is not yours to hand out, so it is not listed. The company's group count also only counts the groups you hold.",
          todo: ["Ask whoever administers that group to grant it to you."],
        },
      ],
    },
    {
      id: "save-stopped",
      title: "A save didn't finish",
      questions: [
        {
          id: "which",
          title: "Which message did you get?",
          options: [
            {
              label: "“… was created, but their access didn't finish saving”",
              result: "stranded",
            },
            { label: "“Access didn't finish saving”", result: "partial" },
          ],
        },
      ],
      results: [
        {
          id: "stranded",
          tone: "bad",
          badge: "Finish it",
          title: "The account exists and the access does not",
          why: "Add user writes the account first and the access second. Stopping in between leaves somebody who can sign in and see nothing.",
          todo: [
            "Press Retry access on the banner.",
            "If you left it, open them from the users list and save again.",
          ],
        },
        {
          id: "partial",
          tone: "warn",
          badge: "Try again",
          title: "Part of it saved",
          why: "The lists have been re-read, so what is on screen is what actually saved rather than what was asked for.",
          todo: ["Press Save changes again to send the rest."],
        },
      ],
    },
  ],

  terms: [
    {
      term: "By group",
      def: "The user gets every store in the base groups you pick, and a store added to one of those groups later shows up for them automatically. Shown as the auto chip. Suits managers, buyers and corporate.",
      anchor: "wizard",
    },
    {
      term: "By store",
      def: "The user gets only the stores you tick, nothing more. A store added to the group later does not reach them. Shown as the fixed chip. Suits a single store or a small multi-store.",
      anchor: "wizard",
    },
    {
      term: "Base group",
      def: "A named set of stores inside one company. It is how access is given to twenty stores at once rather than store by store. Assigning one grants access and nothing else — nothing is copied into anybody's own store groups.",
    },
    {
      term: "Access column",
      def: "How that person holds their base groups: By group, By store, Mixed when their groups disagree, or Not set for an account from before access types existed. Opening them and saving settles it.",
      anchor: "grid",
    },
    {
      term: "Effective stores",
      def: "On the Assignments step of Edit: every store the picks add up to, with what accounts for each one — a group's name, or Direct. Read only, and it follows unsaved picks, so it shows what a change will do before you save it.",
      anchor: "wizard",
    },
    {
      term: "Direct",
      def: "A store granted on the Stores tab rather than through a base group. It belongs to the person, so no group change can take it back, and only the Stores tab can remove it.",
    },
    {
      term: "Unauthorized",
      def: "The user is above your level, so you cannot open or change them.",
      anchor: "grid",
    },
    {
      term: "Finding a user",
      def: "The filters above the list narrow by company, active or inactive, level, role and access type, and Search name matches the name. The Username and Email columns filter from their own headings.",
      anchor: "filters",
    },
    {
      term: "Check Availability",
      def: "Beside the Username and Email labels on the first step. Nothing is checked as you type: press it, or Enter in the box, and the answer appears next to the label.",
      anchor: "wizard",
    },
    {
      term: "Assign all",
      def: "In a dual list, takes every row the column is currently showing. On a base group it respects the search box, so narrow the list first and read the count in the heading before pressing it.",
      anchor: "assign",
    },
    {
      term: "Deactivate and reactivate",
      def: "The trash icon switches somebody off; their companies, base groups and stores are kept. To bring one back, set the status filter to Inactive and use the reactivate icon on their row.",
      anchor: "grid",
    },
    {
      term: "Reset password",
      def: "The key icon on a row. Enter a temporary password twice. Reset security makes them set a new security question the next time they sign in.",
      anchor: "grid",
    },
  ],
};
