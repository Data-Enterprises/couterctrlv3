import { Decimal } from "../../invoices/dev/core/Decimal";
import type {
  InvoiceLine,
  InvoiceParseResp,
  ParsedInvoice,
  ReconcileResp,
} from "../../../api/invoices";
import { amount } from "./exportScanned";

/**
 * A run, arranged for the page: each invoice beside its own checks.
 *
 * The server sends invoices and reconciliation as two lists. They are joined
 * by file and invoice number rather than by position, because a discarded
 * invoice is missing from both and position would be the first thing to
 * drift if that ever changed.
 */
export interface ScannedRow {
  id: string;
  file: string;
  invoice: ParsedInvoice;
  reconcile: ReconcileResp | null;
  reconciled: boolean;
  /** Lines whose extended amount matches neither way of pricing it. */
  lineFlags: boolean[];
}

const cents = (d: Decimal) => d.divideBy(1n, 2);

/**
 * Does the printed extended amount follow from the line's own figures?
 *
 * Either qty × (price − allowance) or qty × price — the prompt allows both,
 * because vendors print both. Compared to the cent. A line with no readable
 * figures is not flagged: there is nothing to say it is wrong.
 */
export const lineLooksOff = (line: InvoiceLine): boolean => {
  const ext = amount(line.ext);
  const price = amount(line.unitPrice);
  const qty = Number.isFinite(line.qty) ? amount(line.qty.toFixed(4)) : null;
  if (!ext || !price || !qty) return false;
  const allowance = amount(line.allowance) ?? Decimal.zero(4);
  const at = (unit: Decimal) =>
    cents(
      new Decimal(unit.units * qty.units, unit.decimals + qty.decimals),
    );
  const printed = cents(ext);
  return !(
    at(price.subtract(allowance)).equals(printed) || at(price).equals(printed)
  );
};

export const scannedRows = (result: InvoiceParseResp): ScannedRow[] => {
  const pool = [...result.reconciliation];
  // The response does not say which file an invoice came from; the
  // reconciliation entry does. Taken in order and removed as used, so two
  // files that both hold invoice 1001 each get their own.
  return result.invoices.map((invoice, index) => {
    const at = pool.findIndex((r) => r.invoiceNumber === invoice.invoiceNumber);
    const reconcile = at === -1 ? null : pool.splice(at, 1)[0];
    const file = reconcile?.file ?? "";
    return {
      id: `${file}:${invoice.invoiceNumber}:${index}`,
      file,
      invoice,
      reconcile,
      reconciled: reconcile?.reconciled ?? false,
      lineFlags: invoice.lines.map(lineLooksOff),
    };
  });
};

/** A printed amount for display: as sent, or a dash. */
export const money = (value: string | null | undefined): string =>
  value === null || value === undefined || value === "" ? "—" : value;

/** `2026-10-14` → "Oct 14, 2026"; anything else as it came. */
export const dateText = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );
};
