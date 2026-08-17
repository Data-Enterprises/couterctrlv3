import type { InfoGlossaryEntry } from "../../components/InfoPopover";

/**
 * Copy for the Invoices "?" popover.
 *
 * Written against the parser, not from memory. The reconciliation wording in
 * particular has to stay true: it is the only claim this page makes about its
 * own accuracy, and overstating it would be worse than saying nothing.
 */
export const INVOICES_INFO: {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
} = {
  title: "Invoices",
  purpose:
    "Reads a vendor's electronic invoice file and shows what it says, line by line. The file is decoded in this browser — nothing is sent anywhere — and every invoice is checked against its own printed totals before it is shown.",
  glossary: [
    {
      term: "Reconciled",
      desc: "Four totals derived from the detail lines are compared to the invoice's own summary record, to the cent: cost, extended retail, allowances and cases. All four matching means the file was decoded correctly. It is the only proof this page offers that the numbers are real, which is why it sits above them.",
    },
    {
      term: "Did not reconcile",
      desc: "A derived total disagrees with the invoice's own figure, so a line was missed or misread. The row names which check failed and by how much. Treat every figure on that invoice as unverified until it's resolved — an invoice that doesn't add up shouldn't be acted on or sent onward.",
    },
    {
      term: "Cost, Retail, Allowances, Cases",
      desc: "Summed from the billed lines. Cost includes delivery charges, which are billed on their own record but counted in the invoice's cost total. Allowances are the deals applied against the order — they reduce what you pay, and are shown separately rather than netted off.",
    },
    {
      term: "GM%",
      desc: "Worked out from each line's own extended cost and retail, not read from any reported field. A margin that disagrees with the two numbers printed beside it would be worse than none.",
    },
    {
      term: "Why amounts are exact",
      desc: "Money is held as whole cents, never as a decimal number. Ordinary arithmetic drifts by fractions of a cent across a few hundred lines, which is enough to make a correctly decoded invoice fail its own reconciliation. Nothing here rounds until it is printed.",
    },
  ],
};
