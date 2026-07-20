import type { InfoGlossaryEntry } from "../../components/InfoPopover";

export const RECEIVERS_INFO: { title: string; purpose: string; glossary: InfoGlossaryEntry[] } = {
  title: "Receivers",
  purpose: "Browse a store's receiving history by vendor, then drill into any invoice to see what was actually received and at what cost.",
  glossary: [
    { term: "Records", desc: "Total line-item rows across all loaded invoices, not the number of invoices." },
    { term: "Vendor ID / Date filters", desc: "Exact match only, not partial search." },
    { term: "Invoice totals", desc: "Calculated from the invoice's own line items, not pulled from a separate total on file." },
  ],
};
