import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setLpOpenReceipt } from "../../../../features/lpActionsSlice";
import { formatCurrency2 } from "../../../../utils";
import { hueFor } from "../../typeColour";
import type { EvidenceRow } from "./facetsModel";

/**
 * The receipts behind the case, one occurrence per row.
 *
 * A zero amount renders as a dash rather than `$0.00`. Twenty-six no-sales are
 * worth nothing and are still the most interesting thing on the screen — a
 * column of zeros says "no data" when the truth is "no money", and the dash
 * keeps those apart.
 *
 * Clicking a row opens the whole receipt over the panel. The row stays marked
 * while it is open so it is obvious which one you are reading.
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

const EvidenceTable = ({ rows, storeid }: Props) => {
  const dispatch = useAppDispatch();
  const openReceipt = useAppSelector((s) => s.lpActions.openReceipt);

  return (
    <div className="max-h-full overflow-auto thin-scrollbar">
      <table className="w-full border-collapse text-[11.5px]">
        <thead>
          <tr>
            {[
              "Date",
              "Time",
              "Transaction",
              "Lane",
              "Type",
              "Item",
              "Qty",
              "Amount",
            ].map((h, i) => (
              <th
                key={h}
                className={`sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-content/85 whitespace-nowrap ${
                  i >= 6 ? "text-right" : "text-left"
                }`}
              >
                {h}
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
                className={`border-b border-gray-100 cursor-pointer transition-colors ${
                  open
                    ? "bg-row_selected"
                    : "odd:bg-row_stripe hover:bg-gray-50"
                }`}
              >
                <td className="px-2.5 py-1.5">{row.date.slice(5)}</td>
                <td className="px-2.5 py-1.5">{clock(row.time)}</td>
                <td className="px-2.5 py-1.5">{row.saleId}</td>
                <td className="px-2.5 py-1.5">{row.lane}</td>
                <td className="px-2.5 py-1.5">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ background: hueFor(row.saleType) }}
                    />
                    {row.saleType}
                  </span>
                </td>
                <td className="px-2.5 py-1.5">{row.item}</td>
                <td className="px-2.5 py-1.5 text-right">{row.qty}</td>
                <td className="px-2.5 py-1.5 text-right">
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
    </div>
  );
};

export default EvidenceTable;
