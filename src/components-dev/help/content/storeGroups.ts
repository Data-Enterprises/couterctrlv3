import type { HelpContent } from "../helpTypes";

/** Help for Store Groups — your own named sets of stores. */
export const STORE_GROUPS_HELP: HelpContent = {
  screen: "Store Groups",
  purpose:
    "Your own named sets of stores — “West Coast”, say — so a search can cover several stores at once instead of one at a time.",

  guides: [
    {
      id: "create",
      title: "Create a group",
      desc: "Name it, then fill it",
      steps: [
        {
          title: "Create it",
          pre: "Press the",
          chip: "+",
          post: "button next to the search box, type a name and press Create. Each of your groups needs a different name.",
          anchor: "create",
        },
        {
          title: "Add stores",
          pre: "Click the group, then",
          chip: "+",
          post: "next to a store under Unassigned.",
          see: "The store moves to Assigned. Each change saves straight away — there is no Save button.",
          anchor: "assign",
        },
        {
          title: "Remove stores",
          pre: "Press",
          chip: "−",
          post: "next to a store under Assigned.",
          anchor: "assign",
        },
        {
          title: "Find a store in a long list",
          pre: "Type part of the name in the search box above the Unassigned or Assigned list.",
          anchor: "assign",
        },
      ],
    },
    {
      id: "use",
      title: "Use a group in a search",
      desc: "Anywhere with a store search",
      steps: [
        {
          title: "Switch the search to Group",
          pre: "On any page with a store search, set Type to",
          chip: "Group",
          post: ", then choose your group in the Group box.",
          see: "Results covering every store in that group.",
        },
      ],
    },
  ],

  fixes: [],

  terms: [
    {
      term: "Rename a group",
      def: "Select it and click the pencil icon next to its name. Type the new name, then press Enter or click away.",
      anchor: "group-list",
    },
    {
      term: "Delete a group",
      def: "Select it, click the trash icon and confirm. It removes the group and its store list, and cannot be undone.",
      anchor: "group-list",
    },
    {
      term: "Whose groups these are",
      def: "Only the groups you created. The search box at the top of the list finds one quickly.",
      anchor: "group-list",
    },
  ],
};
