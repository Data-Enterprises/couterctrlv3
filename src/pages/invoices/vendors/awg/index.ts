import { parseFixedWidth } from "../../core/reader";
import type { ParseWarning } from "../../core/types";
import { groupInvoices, type AwgInvoice } from "./group";
import { reconcileAll, type ReconcileResult } from "./reconcile";
import { AWG_FILE_SPEC } from "./schema";

/**
 * The AWG vendor module: text in, invoices and their reconciliation out.
 *
 * Pure — no React, no Redux, no network. Everything above this layer renders
 * what it returns, which is what lets the same parser sit behind a page today
 * and an upload pipeline tomorrow without either knowing about the other.
 *
 * The file must be read as **ISO-8859-1**. Reading it as UTF-8 shifts every
 * column after the first non-ASCII byte, and the parse fails in a way that
 * looks like bad data rather than a bad decode.
 */
export interface AwgParseResult {
  invoices: AwgInvoice[];
  reconciliation: ReconcileResult[];
  warnings: ParseWarning[];
  countsByType: Record<string, number>;
  /** True when every invoice in the file reconciled — the one figure that says
   *  whether this file is safe to send onward. */
  allReconciled: boolean;
}

export const parseAwgFile = (text: string): AwgParseResult => {
  const { records, warnings, countsByType } = parseFixedWidth(
    text,
    AWG_FILE_SPEC,
  );
  const invoices = groupInvoices(records);
  const reconciliation = reconcileAll(invoices);

  return {
    invoices,
    reconciliation,
    warnings,
    countsByType,
    allReconciled:
      reconciliation.length > 0 && reconciliation.every((entry) => entry.ok),
  };
};

export { AWG_FILE_SPEC, AWG_RECORD } from "./schema";
export type { AwgInvoice } from "./group";
export type { ReconcileCheck, ReconcileResult } from "./reconcile";
