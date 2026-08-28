import { useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import TypeTable from "./TypeTable";
import ContributionPanel from "./ContributionPanel";
import WeekChips from "./charts/WeekChips";
import { useLineFacts } from "./useLineFacts";
import type { CaseFile } from "./caseFileModel";
import type { ContributionView } from "./contributionModel";
import type { WeekWindow } from "../lpActionsMetrics";

/**
 * The case, in one scroll: what happened, where the multiple comes from, then
 * where it fell.
 *
 * The top row is two panels rather than a grid of cards. The table's shared
 * 0×–4× scale prints once in its header instead of under every row, its
 * figures land in real columns, and neither section widens as the panel does —
 * which is what made a group search feel like it had spread out.
 *
 * There are no section headings between the panels and the charts. The table
 * states the numbers and the charts show where those numbers fell: one claim
 * made twice, not two sections. Splitting them under headings made a reader
 * hold a figure in their head while they went looking for its shape.
 *
 * The week picker sits at the top and governs the whole tab, rather than in
 * the middle governing only what came after it — a control between two
 * sections reads as belonging to the one below.
 *
 * The deviation / volume / exposure control that used to sit above the cards
 * is PARKED, not deleted: `CardSortToggle` and `cardSort` both still exist.
 * The table has one honest order — contribution to the headline — and a second
 * way to arrange four rows was a control nobody had asked a question of.
 */
interface Props {
  file: CaseFile;
  /** The week the figures describe, so quantities match their counts. */
  window: WeekWindow | undefined;
  /** The decomposition of the headline multiple, built once by the panel. */
  view: ContributionView;
  /** The charts. Passed in rather than imported so this file stays about
   *  layout and the chart block can be built and tested on its own. */
  children?: React.ReactNode;
}

const CaseBreakdown = ({ file, window, view, children }: Props) => {
  const windows = useAppSelector((s) => s.lpActions.windows);

  /** Resolved once for the whole tab rather than per row. */
  const touched = useMemo(
    () => file.cards.filter((c) => c.count > 0).map((c) => c.saleType),
    [file.cards],
  );
  const facts = useLineFacts(touched, window);

  return (
    <div className="h-full overflow-y-auto thin-scrollbar flex flex-col gap-3 p-4">
      <div className="flex-shrink-0">
        <WeekChips windows={windows} />
      </div>

      {/* Roughly 60/40. The table lost its scale column and its wordy
          verdicts, so it needs less; the contribution rows read better with
          more room for the bar between the name and the figures. */}
      <div className="flex-shrink-0 grid gap-3 grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <TypeTable file={file} rows={view.rows} facts={facts} />
        <ContributionPanel file={file} view={view} />
      </div>

      {children}
    </div>
  );
};

export default CaseBreakdown;
