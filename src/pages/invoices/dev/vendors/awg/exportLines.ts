import { Decimal } from "../../core/Decimal";
import type { ParsedRecord } from "../../core/types";
import { dealsByLine, type LineDeals } from "./allowances";
import { lineCost } from "./cost";
import type { AwgInvoice } from "./group";

/**
 * Every billed line, with the figures an export needs, worked out once.
 *
 * The POS order layout wants costs per case and money at four places. This is
 * where AWG's figures are turned into those, so the export only chooses
 * columns.
 *
 * The figures follow the page: with suggested corrections applied they are
 * the corrected ones — per-pound deals at rate × weight, unrounded per-pound
 * cost — and otherwise what the file prints. Invoices that
 * billed nothing have no lines and contribute none.
 */
export interface ExportLine {
  invoice: AwgInvoice;
  record: ParsedRecord;
  /** 1-based, within the invoice. */
  lineNumber: number;
  cases: bigint;
  pack: bigint;
  randomWeight: boolean;
  /** The line before deals. */
  gross: Decimal;
  /** What the store pays for the line. */
  net: Decimal;
  /** The line's deals, at what the vendor's total counts them as. */
  allowance: Decimal;
  deals: LineDeals | undefined;
  /** Gross per case. */
  caseCost: Decimal;
  /** Net per case. */
  netCaseCost: Decimal;
  /** The shelf price as printed — for `pricingUnit` units. */
  retailPrice: Decimal;
  pricingUnit: bigint;
}

export const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const units = (value: unknown): bigint =>
  value instanceof Decimal ? value.units : 0n;

const money = (value: unknown): Decimal =>
  value instanceof Decimal ? value : Decimal.zero(2);

export const ZERO = "0.0000";

/** Four places, the layouts' money format. */
export const four = (value: Decimal): string =>
  value.divideBy(1n, 4).toString();

/** `2020-08-31` → `8/31/2020 12:00:00 AM`, the layouts' date format. */
export const layoutDate = (iso: unknown): string => {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return `${month}/${day}/${year} 12:00:00 AM`;
};

/**
 * The 13-digit code the layouts use. AWG writes UPCs 15 wide with two
 * leading zeros of padding; all zeros means the line has no UPC — random-
 * weight meat, mostly — and is left blank rather than written as a code.
 */
export const productCode = (upc: unknown): string => {
  const code = text(upc);
  if (/^0*$/.test(code)) return "";
  return code.length === 15 && code.startsWith("00") ? code.slice(2) : code;
};

/** Item description and size, the way the layouts' descriptions read. */
export const description = (record: ParsedRecord): string =>
  [text(record.fields.item_desc), text(record.fields.size)]
    .filter(Boolean)
    .join(" ");

export const exportLines = (invoices: AwgInvoice[]): ExportLine[] => {
  const out: ExportLine[] = [];
  for (const invoice of invoices) {
    if (invoice.lineItems.length === 0) continue;
    const dealsOf = dealsByLine(invoice, invoice.suggested === true);

    invoice.lineItems.forEach((record, index) => {
      const f = record.fields;
      const cases = units(f.case_qty_billed);
      const pack = units(f.pack) || 1n;

      // Corrected, net is the unrounded per-pound cost less what per-pound
      // deals the line did not take off, and gross is built back from it so
      // the line balances; as printed, both are the file's own figures.
      const deals = dealsOf.get(record);
      const allowance = deals?.total ?? Decimal.zero(2);
      const net = invoice.suggested
        ? lineCost(record).subtract(
            deals ? deals.total.subtract(deals.netted) : Decimal.zero(2),
          )
        : money(f.cost_ext);
      const gross = invoice.suggested
        ? net.add(allowance)
        : money(f.mbr_ext_case_cost);

      // Random-weight lines carry no case cost; the line's own gross per case
      // is what it was billed at.
      const caseCost =
        units(f.mbr_case_cost) === 0n && cases > 0n
          ? gross.divideBy(cases, 4)
          : money(f.mbr_case_cost);

      const pricingUnit = units(f.retail_pricing_unit) || 1n;
      const retailPrice = money(f.retail_price);

      out.push({
        invoice,
        record,
        lineNumber: index + 1,
        cases,
        pack,
        randomWeight: f.rwi === "Y",
        gross,
        net,
        allowance,
        deals,
        caseCost,
        netCaseCost: cases > 0n ? net.divideBy(cases, 4) : net,
        retailPrice,
        pricingUnit,
      });
    });
  }
  return out;
};
