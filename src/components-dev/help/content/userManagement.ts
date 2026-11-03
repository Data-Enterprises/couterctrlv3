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
 * The one thing the workflow used to hide: **a base group you create is not
 * yours until you hold it.** The groups list shows only the groups you hold
 * (everything at level 9), so a new group vanished. The page now says so as
 * soon as it is created and offers "Assign it to me"; the entries below
 * follow that.
 *
 * Checked against the page after the 3 Nov fixes (the fix plan in
 * Documents\ccc-dev-plans).
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
          pre: "Role and level first — the level list stops at your own — then the name, username, email and a password typed twice that meets every rule listed beside it. Username and email are not checked on their own: press",
          chip: "Check Availability",
          post: "beside either label, or Enter in the box.",
          see: "Available or Not available next to the label; Continue waits while either is Not available, and until every password rule is ticked. The username can never be changed afterwards.",
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
          pre: "Tick a company in its own right if they should hold it with no group, and the base groups they should hold. By store also wants the individual stores inside each group; By group shows a group's stores read only.",
          see: "The strip under the columns counts what you have picked. Below level 9 only the groups you hold are offered.",
          anchor: "wizard",
        },
        {
          title: "Review",
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
          q: "Create user is greyed out, or a step can't be clicked",
          a: "An earlier step isn't finished. On Review, the line beside Create user says which; the step bar won't jump past a step that isn't ready.",
        },
        {
          q: "Choosing Single Store changed their stores",
          a: "Single Store holds one store, By store, so the rest are unpicked and a note says what was kept. Change the role back and they return.",
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
          see: "The same four steps, every one reachable from the first click. The username is fixed and there is no password box. On a wide window (1280px or more) Assignments also shows Effective stores, adding up what they would hold.",
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
          a: "The line beside it says why: nothing has changed yet, User info isn't finished, Assignments isn't (only when you changed access), or what they hold is still loading.",
        },
        {
          q: "It says it couldn't read their groups, stores or picks",
          a: "What they hold didn't load, so the screen may be missing some of it and Save changes is off. Press Retry.",
        },
        {
          q: "It asks whether to discard my changes",
          a: "Cancel, Back to users and another tab all ask when something hasn't been saved. Nothing asks when nothing changed.",
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
          see: "Role, level, every company they hold, base groups, the access type and any picked stores carried into a new user. Name, username, email and password stay blank. A store granted directly does not copy — it has no group to travel in. The next Add user starts blank again.",
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
          post: "tab. The list shows your companies, each opening to the groups you hold (every group, at level 9).",
          anchor: "tabs",
        },
        {
          title: "Create it",
          pre: "Press the + beside the search box (New base group), then give it a name and a company.",
          anchor: "base-groups",
        },
        {
          title: "Give it to yourself",
          pre: "Below level 9 a note appears once it's created: press",
          chip: "Assign it to me",
          post: ".",
          see: "The group appears in the Base Groups list, held By group. Until you hold it, it is not listed and cannot be filled.",
          anchor: "base-groups",
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
          post: "sub-tab, the same way. Each person gets the group in their own access type, shown beside their name: By group gets the whole group and stores added later; By store gets every store it holds today, picked.",
          anchor: "group-tabs",
        },
      ],
      issues: [
        {
          q: "The group I just created is not in the list",
          a: "You do not hold it yet. Press Assign it to me on the note, or Users → your own row → Edit → Assignments → tick it → save.",
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
      id: "companies",
      title: "Put people in a company",
      desc: "The Companies tab: the outer boundary of what someone sees",
      steps: [
        {
          title: "Open Companies",
          pre: "The",
          chip: "Companies",
          post: "tab, then pick a company on the left.",
          anchor: "tabs",
        },
        {
          title: "Move people",
          pre: "Pick people in Not in this company and press Assign, or pick them in In this company and press Unassign.",
          see: "A person only reaches a base group inside a company they hold, so taking a company away hides their groups in it and the stores those gave.",
          anchor: "companies",
        },
      ],
      issues: [
        {
          q: "What do Assign all and Unassign all take?",
          a: "They take what that column is showing, so narrow it with the search and the company filter first and read the count in the heading. Unassign all always asks first and names the count, and you, if you're in it.",
        },
        {
          q: "Somebody isn't in Not in this company",
          a: "You can add people from your own companies and people who hold no company yet. Somebody elsewhere has to be added by an administrator there.",
        },
      ],
    },
    {
      id: "stores",
      title: "Give one person one store",
      desc: "The Stores tab: a grant no group can take back",
      steps: [
        {
          title: "Open Stores",
          pre: "The",
          chip: "Stores",
          post: "tab, then pick a store on the left.",
          anchor: "tabs",
        },
        {
          title: "Move people",
          pre: "Pick people in Not assigned and press Assign, or in Assigned and press Unassign.",
          see: "A grant made here is fixed: no group stands behind it, so no group change takes it away, and Edit shows it as Direct.",
          anchor: "stores",
        },
      ],
      issues: [
        {
          q: "Somebody won't come off a store",
          a: "They hold it through a base group, and the message names it. Take them out of that group, or the store out of the group, instead.",
        },
        {
          q: "Assign all or Unassign all took more than the search showed",
          a: "On this tab they take everyone in the list, search or not. Unassign all always asks first and names the count.",
        },
      ],
    },
    {
      id: "export",
      title: "Export a list",
      desc: "Users or stores, as a CSV file",
      steps: [
        {
          title: "Press Export CSV",
          pre: "The download icon in the dark header, on the Users or Stores tab.",
          anchor: "export",
        },
        {
          title: "Choose what goes in",
          pre: "On Users: All users, Current filter results, or both, then",
          chip: "Download CSV",
          post: ".",
          see: "The users file has username, names, email, role, level, access type and last visit. Current filter results can only be ticked while a filter is set.",
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
          see: "Reset security, beside it, asks first, then makes them set a new security question at their next sign-in.",
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
            "Press Assign it to me on the note that appears after creating it.",
            "If you closed it: Users → your own row → Edit → Assignments, tick the new group and save.",
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
          why: "What did save has been re-read, and your changes are still on screen, so what didn't save is still different.",
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
      def: "On the Assignments step of Edit, on a window 1280px wide or more: every store the picks add up to, with what accounts for each one — a group's name, or Direct. Read only, and it follows unsaved picks, so it shows what a change will do before you save it.",
      anchor: "wizard",
    },
    {
      term: "Direct",
      def: "A store granted on the Stores tab rather than through a base group. It belongs to the person, so no group change can take it back, and only the Stores tab can remove it.",
    },
    {
      term: "Not yours to change",
      def: "On Assignments, a group the person holds that you don't. It's shown so an edit can't drop it by accident, and it can't be ticked, unticked or cleared. Someone who holds the group (or level 9) can change it.",
      anchor: "wizard",
    },
    {
      term: "Unauthorized",
      def: "The user is above your level, so you cannot open or change them.",
      anchor: "grid",
    },
    {
      term: "Finding a user",
      def: "The filters above the list narrow by company, active or inactive, level, role and access type, and Search name matches the name. The Username and Email columns filter from their own headings. Click First name, Last name, Role, Level, Access or Last visited to sort by it; click again to reverse, a third time for the original order.",
      anchor: "filters",
    },
    {
      term: "Check Availability",
      def: "Beside the Username and Email labels on the first step. Nothing is checked as you type: press it, or Enter in the box, and the answer appears next to the label.",
      anchor: "wizard",
    },
    {
      term: "Assign all and Unassign all",
      def: "On a base group and on the Companies tab they take the rows the column is showing, so narrow it first. On the Stores tab they take everyone in the list, search or not. Unassign all always asks first, naming the count (and you, if you're in it); Assign all asks above five.",
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
