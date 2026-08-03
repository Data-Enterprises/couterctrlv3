import type { PortalField } from "../shared/PortalForm";

/** "Contact support" copy and field schema, verbatim from the handoff.
 *  Field ids match IMPLEMENTATION.md §3's table for POST /api/support. */

export const SUPPORT_COPY = {
  kicker: "CounterCtrl Cloud",
  title: "Contact support",
  intro:
    "Tell us what's going on and we'll get back to you. Support is staffed Monday to Friday, with on-call cover for overnight load issues.",
  submit: "Send to support",
  confirmation:
    "We've got it. Someone from support will follow up at the email you gave us.",
};

export const SUPPORT_FIELDS: PortalField[] = [
  { id: "name", label: "Your name", kind: "text", placeholder: "Jane Whitaker", required: true, missLabel: "your name" },
  { id: "company", label: "Company", kind: "text", placeholder: "Whitaker Markets", required: true, missLabel: "company" },
  { id: "email", label: "Work email", kind: "email", placeholder: "jane@whitakermarkets.com", required: true, missLabel: "a valid work email" },
  { id: "phone", label: "Phone", kind: "tel", placeholder: "Optional" },
  { id: "location", label: "Location or store number", kind: "text", placeholder: "Optional" },
  {
    id: "urgency",
    label: "How urgent?",
    kind: "select",
    options: [
      "Select one",
      "Whenever you get to it",
      "Today if possible",
      "Blocking work right now",
    ],
  },
  {
    id: "issue_type",
    label: "What do you need help with?",
    kind: "select",
    required: true,
    wide: true,
    missLabel: "what you need help with",
    options: [
      "Select one",
      "I can't sign in",
      "A number looks wrong",
      "A report or module isn't working",
      "New user or permission change",
      "Training or how do I…",
      "Something else",
    ],
  },
  {
    id: "message",
    label: "Describe it",
    kind: "textarea",
    required: true,
    wide: true,
    missLabel: "a description",
    placeholder:
      "What were you doing, what did you expect, and what happened instead?",
  },
];
