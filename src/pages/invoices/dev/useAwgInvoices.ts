import { useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import { parseAwgFile } from "./vendors/awg";
import { applyEdits } from "./vendors/awg/applyEdit";
import { reconcileAll } from "./vendors/awg/reconcile";
import { presentInvoices, type InvoiceRow } from "./present";
import type { ParseWarning } from "../../../interfaces";
import type { TrailerCheck } from "./vendors/awg";

export interface AwgInvoicesView {
  rows: InvoiceRow[];
  warnings: ParseWarning[];
  countsByType: Record<string, number>;
  /** True when every invoice in the file reconciles as it currently stands —
   *  edits included. The figure that says whether this file is safe to send. */
  allReconciled: boolean;
  /** How many invoices currently fail, for the filter chip. */
  failedCount: number;
  /** Whether the file's trailer counts say it arrived whole. Null before a
   *  file is read. */
  trailer: TrailerCheck | null;
}

const EMPTY: AwgInvoicesView = {
  rows: [],
  warnings: [],
  countsByType: {},
  allReconciled: false,
  failedCount: 0,
  trailer: null,
};

/**
 * The file and its corrections, as rows to render.
 *
 * Parse → apply edits → reconcile → present, in that order, and all of it
 * derived. Nothing here is stored: Redux holds the file text and the list of
 * edits, and this rebuilds the rest whenever either changes. That is what makes
 * a correction recompute the totals and re-run the four checks for free — the
 * same contract the standalone parser uses, where `present` is pure and a fresh
 * projection is cheaper than keeping two copies in step.
 *
 * Memoised on the pair, so typing in a filter or opening a card does not
 * re-parse four hundred records.
 */
export const useAwgInvoices = (): AwgInvoicesView => {
  const fileText = useAppSelector((s) => s.dev.invoices.fileText);
  const edits = useAppSelector((s) => s.dev.invoices.edits);

  return useMemo(() => {
    if (!fileText) return EMPTY;

    const parsed = parseAwgFile(fileText);
    if (parsed.invoices.length === 0) return EMPTY;

    // Reconciliation has to run against the edited invoices, not the parsed
    // ones — the whole point of a correction is that the checks move.
    const invoices = applyEdits(parsed.invoices, edits);
    const reconciliation = reconcileAll(invoices);
    const rows = presentInvoices(invoices, reconciliation);

    return {
      rows,
      warnings: parsed.warnings,
      countsByType: parsed.countsByType,
      allReconciled:
        reconciliation.length > 0 && reconciliation.every((r) => r.ok),
      failedCount: reconciliation.filter((r) => !r.ok).length,
      trailer: parsed.trailer,
    };
  }, [fileText, edits]);
};
