import * as XLSX from "xlsx";
import type { AdListRow } from "../../features/adListSlice";

/**
 * AD list workbook → rows.
 *
 * Lifted verbatim out of `AdListInput` so the dev card can use its own button
 * and hidden input without a second copy of the column mapping. The mapping is
 * unchanged — same column names, same `unitAdRetail = adRetail / adCount`.
 */

const num = (v: unknown): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};
const str = (v: unknown): string => (v == null ? "" : String(v).trim());

export const isAdListFile = (name: string) =>
  name.endsWith(".xlsx") || name.endsWith(".xls");

export const parseAdListWorkbook = (data: ArrayBuffer): AdListRow[] => {
  const wb = XLSX.read(new Uint8Array(data), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
  });

  const rows: AdListRow[] = json
    .map((r) => {
      const adCount = Math.max(num(r["Ad Count"]), 1);
      const adRetail = num(r["Ad Retail"]);
      return {
        upc: str(r["UPC"]),
        pageName: str(r["Page Name"]),
        featureDescription: str(r["Feature Description"]),
        pack: str(r["Pack"]),
        size: str(r["Size"]),
        cost: num(r["COST"]),
        costPlusFrt: num(r["COST+FRT"]),
        amap: num(r["AMAP"]),
        eba: num(r["EBA"]),
        dsdOI: num(r["DSD OI"]),
        edlcBB: num(r["EDLC BB"]),
        netUnitCost: num(r["Net Unit Cost"]),
        adCount,
        adRetail,
        unitAdRetail: adRetail / adCount,
        regularRetail: num(r["Regular Retail"]),
        mvmt: num(r["Mvmt"]),
        grossProfit: num(r["Gross Profit"]),
        featureNotes: str(r["Feature Notes"]),
        tprDates: str(r["TPR Dates"]),
      };
    })
    .filter((r) => r.upc !== "");

  return rows;
};
