import type {
  ExtractedInvoice,
  InvoiceReconciliation,
  InvoiceRun,
} from "./types";

export interface RunRow {
  id: string;
  invoice: ExtractedInvoice;
  recon: InvoiceReconciliation | undefined;
  reconciled: boolean;
}

/** `invoices` and `reconciliation` are appended together server-side, so they
 *  line up by index. The invoice number check guards against that changing. */
export const toRows = (run: InvoiceRun): RunRow[] =>
  run.invoices.map((invoice, index) => {
    const candidate = run.reconciliation[index];
    const recon =
      candidate?.invoiceNumber === invoice.invoiceNumber
        ? candidate
        : run.reconciliation.find(
            (r) => r.invoiceNumber === invoice.invoiceNumber,
          );
    return {
      id: `${index}-${invoice.invoiceNumber}`,
      invoice,
      recon,
      reconciled: recon?.reconciled ?? false,
    };
  });
