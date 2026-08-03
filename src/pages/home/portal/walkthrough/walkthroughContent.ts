import type { PortalField } from "../shared/PortalForm";

/** "Book a walkthrough" copy and field schema, verbatim from the handoff.
 *  Field ids match IMPLEMENTATION.md §3's table so the payload keys line up
 *  with what the endpoint is specced to accept. */

export const WALKTHROUGH_COPY = {
  kicker: "CounterCtrl Cloud",
  title: "Book a walkthrough",
  intro:
    "We'll run CounterCtrl against a slice of your own data and walk your team through what it surfaces. Usually about thirty minutes. Tell us a little and we'll follow up within one business day.",
  submit: "Request a walkthrough",
  confirmation:
    "We'll be in touch within one business day to find a time that works for your team.",
};

export const WALKTHROUGH_FIELDS: PortalField[] = [
  { id: "name", label: "Your name", kind: "text", placeholder: "Jane Whitaker", required: true, missLabel: "your name" },
  { id: "company", label: "Company", kind: "text", placeholder: "Whitaker Markets", required: true, missLabel: "company" },
  { id: "email", label: "Work email", kind: "email", placeholder: "jane@whitakermarkets.com", required: true, missLabel: "a valid work email" },
  { id: "phone", label: "Phone", kind: "tel", placeholder: "Optional" },
  {
    id: "role",
    label: "Your role",
    kind: "select",
    options: [
      "Select one",
      "Owner or executive",
      "District or regional manager",
      "Store manager",
      "Merchandising or category",
      "Loss prevention",
      "IT",
      "Other",
    ],
  },
  {
    id: "locations",
    label: "Locations",
    kind: "select",
    options: ["Select one", "1 – 5", "6 – 20", "21 – 50", "More than 50"],
  },
  {
    id: "pos_system",
    label: "What POS system do you run?",
    kind: "text",
    placeholder: "We work with most — this just helps us prepare",
    wide: true,
  },
  {
    id: "interest",
    label: "What would you most like to see?",
    kind: "select",
    wide: true,
    options: [
      "Select one",
      "Sales performance across locations",
      "Loss prevention and register exceptions",
      "Margin and pricing trends",
      "Orders and receiving variance",
      "Coupons and promotions",
      "Not sure yet — show me the whole thing",
    ],
  },
  {
    id: "notes",
    label: "Anything else we should know?",
    kind: "textarea",
    placeholder: "What's costing your team the most time right now?",
    wide: true,
  },
];
