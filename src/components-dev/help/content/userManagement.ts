import type { HelpContent } from "../helpTypes";

/**
 * Help for User Management.
 *
 * Written against the dev tree as it stands: a four-step wizard
 * (User info → Access type → Assignments → Review) and a user detail of two
 * tabs, Basic info and Access. The older help describes four tabs and no
 * access type, which is the shape prod still has — this file follows dev,
 * which is the tree the panel runs in.
 */
export const USER_MANAGEMENT_HELP: HelpContent = {
  screen: "User Management",
  purpose:
    "Add and manage your users, and decide which stores each of them can see.",

  guides: [
    {
      id: "add",
      title: "Add a user",
      desc: "Four steps, nothing written until the last one",
      steps: [
        {
          title: "User info",
          pre: "Role, level, name, username, email and password. You can only give out levels up to your own.",
          anchor: "wizard",
        },
        {
          title: "Access type",
          pre: "Choose",
          chip: "By group",
          post: "— they see every store in the base groups you pick, and new stores show up automatically — or By store, where they see only the stores you pick and new ones must be added by hand.",
          see: "Which one you choose decides what the next step asks for.",
          anchor: "wizard",
        },
        {
          title: "Assignments",
          pre: "Pick base groups, or pick individual stores, depending on the type you chose.",
          anchor: "wizard",
        },
        {
          title: "Review and create",
          pre: "The last step is where it is written. Nothing is saved before it.",
          anchor: "wizard",
        },
      ],
      issues: [
        {
          q: "Which access type should I pick?",
          a: "By group suits managers, buyers and corporate — anyone who should follow a group as it grows. By store suits a single store or a small multi-store, where the list is deliberate and should not change on its own.",
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
          pre: "Click the Duplicate icon on a user's row.",
          see: "Their role, level and access carried into a new user. Name, username, email and password stay blank — a duplicate never half-becomes the person it was copied from.",
          anchor: "grid",
        },
      ],
    },
    {
      id: "change-access",
      title: "Change what a user can see",
      desc: "One Access tab, one Save",
      steps: [
        {
          title: "Open the user",
          pre: "Click the pencil icon on their row.",
          anchor: "grid",
        },
        {
          title: "Go to Access",
          pre: "The",
          chip: "Access",
          post: "tab holds their companies, base groups and stores together.",
          anchor: "tabs",
        },
        {
          title: "Save",
          pre: "Save access writes it. Only what you changed is sent.",
          anchor: "tabs",
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
          why: "A user whose level is higher than yours cannot be opened or changed, so the row shows Unauthorized instead of the actions.",
          todo: ["Ask someone at or above their level to make the change."],
        },
        {
          id: "missing",
          tone: "ok",
          badge: "By design",
          title: "You only see users who share a company with you",
          why: "The list is scoped to the companies on your own account, so somebody in a company you do not hold will not appear.",
          todo: [
            "Check the company filter above the list.",
            "If they should be visible, the company needs adding to your account.",
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
  ],

  terms: [
    {
      term: "By group",
      def: "The user sees every store in the base groups you pick, and a store added to one of those groups later shows up for them automatically. Suits managers, buyers and corporate.",
      anchor: "wizard",
    },
    {
      term: "By store",
      def: "The user sees only the stores you pick, nothing more. A new store has to be added by hand. Suits a single store or a small multi-store.",
      anchor: "wizard",
    },
    {
      term: "Base groups",
      def: "Named sets of stores within a company. They are how access is given to a group of stores at once rather than store by store.",
    },
    {
      term: "Unauthorized",
      def: "The user is above your level, so you cannot open or change them.",
      anchor: "grid",
    },
    {
      term: "Finding a user",
      def: "The filters above the list narrow by company, active or inactive, level or role, and Search name matches the name. The Username and Email columns filter from their own headings.",
      anchor: "filters",
    },
    {
      term: "Reset password",
      def: "The key icon on a row. Enter a temporary password twice. Reset security makes them set a new security question the next time they sign in.",
      anchor: "grid",
    },
    {
      term: "Delete and reactivate",
      def: "The trash icon removes a user. To bring one back, set the status filter to Inactive and use the Reactivate icon on their row.",
      anchor: "grid",
    },
  ],
};
