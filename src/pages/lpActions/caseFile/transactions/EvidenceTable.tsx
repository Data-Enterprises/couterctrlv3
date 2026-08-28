import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  setLpOpenReceipt,
  setLpEvidenceSort,
} from "../../../../features/lpActionsSlice";
import type { LpEvidenceSortCol } from "../../../../features/lpActionsSlice";
import SortHeader from "../../../../components/SortHeader";
import { sortEvidence } from "./evidenceSort";
import { formatCurrency2 } from "../../../../utils";
import { hueFor } from "../../typeColour";
import type { EvidenceRow } from "./facetsModel";

/**
 * The receipts behind the case, one occurrence per row.
 *
 * Dressed as Loss Prevention's own transaction grid: a sticky header on
 * `gray-100`, `px-3 py-2` cells at 13px, and rows divided by the navy hairline
 * the rest of LP uses. It sits flush inside the panel rather than in a card —
 * the panel IS the card, and a bordered box inside it reads as a second one.
 *
 * A zero amount renders as a dash rather than `$0.00`. Twenty-six no-sales are
 * worth nothing and can still be the most interesting thing on the screen — a
 * column of zeros says "no data" when the truth is "no money", and the dash
 * keeps those apart.
 *
 * Clicking a row opens the whole receipt over the panel. The row stays marked
 * while it is open so it is obvious which one is being read.
 */
interface Props {
  rows: EvidenceRow[];
  /** The store these receipts belong to. `cashiers/transaction` needs it
   *  alongside the date and the sale id, and a receipt line does not carry
   *  one — the operator does. */
  storeid: number;
}

const clock = (raw: string) => {
  if (raw.length < 4) return "—";
  const padded = raw.padStart(6, "0");
  const h = Number(padded.slice(0, 2));
  const m = padded.slice(2, 4);
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${m} ${h < 12 ? "am" : "pm"}`;
};

/**
 * The transaction number, not the whole sale id.
 *
 * A sale id is a compound key — store, transaction, lane, day, year — and only
 * the second field is what anyone calls a receipt. Same split
 * `lossPrevention/Transaction.tsx` renders. The full id stays the identity
 * the receipt is opened by; this is only what is shown.
 */
const txnOf = (saleId: string) => saleId.split("-")[1] ?? saleId;

/**
 * The grid's columns. Type and Item carry no `col`, so they render as plain
 * headers — both are already facets on the left, where picking one narrows the
 * grid rather than shuffling it.
 */
const HEADS: { label: string; col?: LpEvidenceSortCol; right?: boolean }[] = [
  { label: "Date", col: "date" },
  { label: "Time", col: "time" },
  { label: "Transaction", col: "txn" },
  { label: "Lane", col: "lane" },
  { label: "Type" },
  { label: "Item" },
  { label: "Qty", col: "qty", right: true },
  { label: "Amount", col: "amount", right: true },
];

const HEAD =
  "text-[12px] font-semibold text-content/85 hover:text-content";

const EvidenceTable = ({ rows: given, storeid }: Props) => {
  const dispatch = useAppDispatch();
  const { openReceipt, evidenceSort } = useAppSelector((s) => s.lpActions);

  const rows = sortEvidence(given, evidenceSort);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-[12px] text-content/85">
        Nothing matches these filters.
      </div>
    );
  }

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          {HEADS.map((h) => (
            <th
              key={h.label}
              className={`sticky top-0 z-10 bg-gray-100 border-b border-gray-100 px-3 py-2 whitespace-nowrap ${
                h.right ? "text-right" : "text-left"
              }`}
            >
              {h.col ? (
                <SortHeader
                  col={h.col}
                  label={h.label}
                  sort={evidenceSort}
                  onSort={(c) => dispatch(setLpEvidenceSort(c))}
                  className={`${HEAD} ${h.right ? "justify-end w-full" : ""}`}
                />
              ) : (
                <span className={HEAD}>{h.label}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const open = openReceipt?.saleId === row.saleId;
          return (
            <tr
              key={row.id}
              onClick={() =>
                dispatch(
                  setLpOpenReceipt({
                    saleId: row.saleId,
                    storeid,
                    date: row.date,
                    saleType: row.saleType,
                  }),
                )
              }
              className={`border-b border-b-[#1e2a4a]/15 cursor-pointer transition-colors ${
                open ? "bg-row_selected" : "hover:bg-gray-50"
              }`}
            >
              <td className="px-3 py-2 text-content">{row.date.slice(5)}</td>
              <td className="px-3 py-2 text-content">{clock(row.time)}</td>
              <td className="px-3 py-2 font-semibold text-[#1e2a4a] underline underline-offset-2">
                {txnOf(row.saleId)}
              </td>
              <td className="px-3 py-2 text-content">{row.lane}</td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-content">
                  <span
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ background: hueFor(row.saleType) }}
                  />
                  {row.saleType}
                </span>
              </td>
              <td className="px-3 py-2 text-content">{row.item}</td>
              <td className="px-3 py-2 text-right text-content">{row.qty}</td>
              <td className="px-3 py-2 text-right text-content">
                {row.amount === 0 ? (
                  <span className="text-content/85">&mdash;</span>
                ) : (
                  formatCurrency2(row.amount)
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default EvidenceTable;
