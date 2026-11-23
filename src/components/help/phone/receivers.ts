// Interfaces
import type { PhoneHelp } from "../helpTypes";

/** Help for Receivers on a phone. Ported from its `-mobile` help page. */
export const RECEIVERS_PHONE_HELP: PhoneHelp = {
  screen: "Receivers",
  purpose:
    "Browse a store's receiving history by vendor, then drill into any invoice to see what was actually received and at what cost.",

  questions: [
    {
      q: "How do I load receivers?",
      a: [
        "Pick a store, set the date range and tap Load Receivers. This page works one store at a time. The button says \"Select Store\" until you pick one.",
      ],
    },
    {
      q: "What do the numbers at the top mean?",
      a: [
        "Receivers is the number of invoices, Items is the total item count, and Vendors and Operators are how many different vendors and people entered them.",
      ],
    },
    {
      q: "How do I find an invoice?",
      a: [
        "Dates are listed newest first with their invoice count. Tap a date to see its invoices, each with the invoice number, vendor and item count.",
      ],
    },
    {
      q: "How do I see what was on an invoice?",
      a: [
        "Tap the invoice to open it in a panel from the bottom. You'll see its totals for lines, cases, units and cost, then each item with its cases, units, cost and GM%.",
      ],
    },
    {
      q: "What do the GM% colors mean?",
      a: [
        "GM% is the gross margin for the line. It shows green at 30% or more, amber from 25% up to 30%, and red below 25%.",
      ],
    },
    {
      q: "Why do I see location tabs?",
      a: [
        "Some stores have more than one location. When they do, tabs appear above the list so you can switch between locations.",
      ],
    },
    {
      q: "How do I export an invoice or start over?",
      a: [
        "Tap Export in an open invoice to download its lines as a CSV. Tap Back at the top to change the store or dates, and use Back to results to return without searching again.",
      ],
    },
  ],

  terms: [
    {
      term: "Records",
      def: "Total line-item rows across all loaded invoices, not the number of invoices.",
    },
    {
      term: "Vendor ID / Date filters",
      def: "Exact match only, not partial search.",
    },
    {
      term: "Invoice totals",
      def: "Calculated from the invoice's own line items, not pulled from a separate total on file.",
    },
  ],
};
