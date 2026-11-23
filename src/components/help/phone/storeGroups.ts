// Interfaces
import type { PhoneHelp } from "../helpTypes";

/** Help for Store Groups on a phone. Ported from its `-mobile` help page. */
export const STORE_GROUPS_PHONE_HELP: PhoneHelp = {
  screen: "Store Groups",
  purpose:
    "Build your own groups of stores so you can look at several stores together in one search.",

  questions: [
    {
      q: "What is a store group?",
      a: [
        "A store group is a named set of stores you pick yourself, such as \"West Coast\". Once it's set up, you can search the whole group at once instead of one store at a time.",
      ],
    },
    {
      q: "How do I create a group?",
      a: [
        "Tap Create, type a name in Group Name and tap Submit. Your existing groups are shown above, and you'll see a warning if the name is already used.",
      ],
    },
    {
      q: "How do I add or remove stores?",
      a: [
        "Tap Assign and choose a group under Select User Group. Tap a store in the Unassigned list to add it, or tap one in the Assigned list to remove it.",
      ],
    },
    {
      q: "How do I find a store in a long list?",
      a: [
        "Type part of the store name in the box at the top of the Unassigned or Assigned list.",
      ],
    },
    {
      q: "How do I rename a group?",
      a: [
        "Tap Update, tap the group, change the name in Group Name and tap Submit.",
      ],
    },
    {
      q: "How do I delete a group?",
      a: [
        "Tap Delete, tap the group, tap the Delete button, then tap Yes. This can't be undone.",
      ],
    },
    {
      q: "Why are some groups missing under Update, Delete or Assign?",
      a: [
        "Shared groups can't be changed on your phone, so they are left out of those lists. Only the person who created a shared group can change it, from User Management on a computer.",
      ],
    },
    {
      q: "How do I use a group in a search?",
      a: [
        "When a page lets you search by Group, choose one of your groups, or choose Shared to pick a shared group. The results cover every store in that group you have access to.",
      ],
    },
    {
      q: "Whose groups are listed here?",
      a: [
        "The groups you created, plus any shared groups you've been given. Shared groups can be used in a search but not changed here.",
      ],
    },
  ],

  terms: [
  ],
};
