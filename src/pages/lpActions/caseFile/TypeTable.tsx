import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setLpFocusedType } from "../../../features/lpActionsSlice";
import { formatCurrency2 } from "../../../utils";
import { hueFor } from "../typeColour";
import { VALUE_TEXT, multipleLabel } from "../roster/rosterTheme";
import { factsFor, type LineFacts } from "./useLineFacts";
import type { CaseFile } from "./caseFileModel";
import type { Contribution } from "./contributionModel";

/**
 * Every exception type, one row each.
 *
 * This was five cards. A table beats them because the figures land in real
 * columns, so a reader compares by running down one rather than by hopping
 * between five boxes — and because it stops the section widening as the panel
 * does, which is what made a group search feel like it had spread out.
 *
 * Unlabelled: the columns name themselves, and a title bar reading "By
 * exception type" above a column headed TYPE was a row of chrome restating the
 * row beneath it.
 *
 * Ordered by contribution to the headline multiple, biggest first — the row to
 * pull leads, without anyone sorting it.
 *
 * No 0×–4× bar. The panel to the right already draws every type's excess
 * against one scale, and a second set of bars saying the same thing in a
 * narrower column was duplication rather than insight. What a NEGATIVE
 * contribution means — this week came in under their own baseline, which is
 * better than the weeks before it — is on that panel's hover, where this page
 * keeps its explanations.
 *
 * The `vs base` column carries a figure whenever there is one — including a
 * decrease, which is a real finding and used to be hidden behind a word. A
 * dash means only one thing: nothing of this type rang and nothing ever has,
 * so there is no change to report. Words like "not rated" said the same as a
 * dash at four times the width.
 *
 * A thin week still shows its multiple, but in the neutral tone rather than a
 * severity colour — `gradeChange` refuses to grade under the volume floor, so
 * one refund against a baseline of a third of one prints its 3.0× without
 * claiming the number means something.
 *
 * A type with no activity keeps its row: `Backup 0` says this operator's
 * problem is specific, which is half of what lets a case be put down.
 *
 * Clicking a row isolates the charts to that type and carries it into the
 * Evidence tab as its opening filter.
 */
interface Props {
  file: CaseFile;
  rows: Contribution[];
  facts: LineFacts;
}

const HEAD =
  "text-[12px] font-semibold uppercase tracking-wide text-content/85";

const TypeTable = ({ file, rows, facts }: Props) => {
  const dispatch = useAppDispatch();
  const focusedType = useAppSelector((s) => s.lpActions.focusedType);

  const { headline } = file;
  const totalQty = facts.ready ? facts.qty : null;
  const totalReceipts = file.cards.reduce((sum, c) => sum + c.receipts, 0);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* Scrolls rather than clipping — a column cut off mid-figure reads as
          broken where a scrollbar reads as narrow. */}
      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full border-collapse text-[13px] min-w-[520px]">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-100">
              <th className={`px-3 py-2 text-left ${HEAD}`}>Type</th>
              <th className={`px-3 py-2 text-right ${HEAD}`}>Count</th>
              <th className={`px-3 py-2 text-right ${HEAD}`}>Total</th>
              <th className={`px-3 py-2 text-right ${HEAD}`}>Avg</th>
              <th className={`px-3 py-2 text-right ${HEAD}`}>Qty</th>
              <th className={`px-3 py-2 text-right ${HEAD}`}>Trans</th>
              <th className={`px-3 py-2 text-right ${HEAD}`}>vs base</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(({ card }) => {
              const on = focusedType === card.saleType;
              const zero = card.count === 0;
              // Nothing now and nothing before: the only state with no change
              // to report. Everything else has a figure.
              const silent = zero && card.baseline === 0;
              const units = facts.ready
                ? String(factsFor(facts, card.saleType).qty)
                : "—";

              return (
                <tr
                  key={card.saleType}
                  onClick={() =>
                    dispatch(setLpFocusedType(on ? null : card.saleType))
                  }
                  className={`border-b border-b-[#1e2a4a]/15 cursor-pointer transition-colors ${
                    on ? "bg-row_selected" : "hover:bg-gray-50"
                  } ${zero ? "opacity-85" : ""}`}
                >
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ background: hueFor(card.saleType) }}
                      />
                      <span className="font-semibold text-content">
                        {card.saleType}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-content">
                    {card.count}
                  </td>
                  <td className="px-3 py-2 text-right text-content">
                    {zero ? "—" : formatCurrency2(card.total)}
                  </td>
                  <td className="px-3 py-2 text-right text-content">
                    {zero ? "—" : formatCurrency2(card.average)}
                  </td>
                  <td className="px-3 py-2 text-right text-content">
                    {zero ? "—" : units}
                  </td>
                  <td className="px-3 py-2 text-right text-content">
                    {zero ? "—" : card.receipts}
                  </td>

                  <td
                    title={
                      silent
                        ? "Nothing of this type this week, and none before it."
                        : card.count < card.ratedAbove
                          ? `Only ${card.count} this week — under ${card.ratedAbove}, so the change is shown but not graded.`
                          : undefined
                    }
                    className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${VALUE_TEXT[card.severity]}`}
                  >
                    {silent
                      ? "—"
                      : card.multiple === null
                        ? "new"
                        : `${card.multiple.toFixed(1)}×`}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-gray-50">
              <td className="px-3 py-2 font-semibold text-content">Totals</td>
              <td className="px-3 py-2 text-right font-semibold text-content">
                {headline.latest}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-content">
                {formatCurrency2(headline.exceptionValue)}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-content">
                {headline.latest > 0
                  ? formatCurrency2(headline.exceptionValue / headline.latest)
                  : "—"}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-content">
                {totalQty === null ? "—" : totalQty}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-content">
                {totalReceipts}
              </td>
              <td
                className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${VALUE_TEXT[headline.severity]}`}
              >
                {multipleLabel(headline.multiple, headline.severity)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TypeTable;
