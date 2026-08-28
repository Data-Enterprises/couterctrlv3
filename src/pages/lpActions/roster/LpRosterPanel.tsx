import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setLpCase } from "../../../features/lpActionsSlice";
import { ALL_TYPES } from "../case/caseModel";
import RosterHeader from "./RosterHeader";
import RosterChips from "./RosterChips";
import StoreSection from "./StoreSection";
import CashierRow from "./CashierRow";
import { buildRoster, filterRoster } from "./rosterModel";
import type { LpSeverity } from "../lpActionsMetrics";

/**
 * Who moved — the roster this page now leads with.
 *
 * The case file on the right answers for one person, so the list that reaches
 * it is rooted on the person too. Store first when the search covered more
 * than one, cashiers under it, worst first at both levels.
 *
 * Derived, never fetched. The exception walk already downloaded every
 * transaction across every week, so re-rooting the list is a single pass over
 * `rawRows` and costs nothing at the network.
 */
interface Props {
  onSearchOpen: () => void;
  onAddWeek: () => void;
  addingWeek: boolean;
}

const LpRosterPanel = ({ onSearchOpen, onAddWeek, addingWeek }: Props) => {
  const dispatch = useAppDispatch();
  const { rawRows, windows, sevFilter, rosterQuery, caseCashier } =
    useAppSelector((s) => s.lpActions);

  const roster = useMemo(
    () => buildRoster(rawRows, windows),
    [rawRows, windows],
  );

  /** Counts are of the WHOLE roster, not the filtered one — a chip reading
   *  "Watch 0" because Investigate is selected would be lying about the data
   *  rather than describing the filter. */
  const counts = useMemo(() => {
    const acc: Record<LpSeverity, number> = {
      investigate: 0,
      watch: 0,
      steady: 0,
    };
    roster.forEach((s) => s.cashiers.forEach((c) => (acc[c.severity] += 1)));
    return acc;
  }, [roster]);

  const visible = useMemo(
    () => filterRoster(roster, sevFilter, rosterQuery),
    [roster, sevFilter, rosterQuery],
  );

  const shown = useMemo(
    () => visible.reduce((acc, s) => acc + s.cashiers.length, 0),
    [visible],
  );

  /**
   * Land on the worst operator rather than on an empty right panel.
   *
   * The roster is already sorted worst first at both levels, so the first
   * cashier of the first store is the one a manager should open. Only ever
   * fires when nothing is selected — re-selecting on every filter change would
   * yank the case out from under someone mid-read.
   */
  const first = visible[0]?.cashiers[0];
  useEffect(() => {
    if (caseCashier || !first) return;
    dispatch(
      setLpCase({
        ref: { storeid: first.storeid, cashierNumber: first.cashierNumber },
        type: ALL_TYPES,
      }),
    );
  }, [caseCashier, first, dispatch]);

  /** One store in scope: the store row would be a header over a list of one,
   *  so it collapses away and the cashiers become the top-level list. */
  const flat = visible.length === 1;

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm flex flex-col h-full">
        <RosterHeader
          count={shown}
          onSearchOpen={onSearchOpen}
          onAddWeek={onAddWeek}
          addingWeek={addingWeek}
        />
        <RosterChips counts={counts} />

        <div className="flex-shrink-0 flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 text-[11.5px] font-semibold uppercase tracking-wide text-content/85">
          <span className="w-2 flex-shrink-0" />
          <span className="flex-1 min-w-0">Cashier</span>
          <span className="w-[46px] text-center flex-shrink-0">
            {windows.length} wks
          </span>
          <span className="w-[58px] text-right flex-shrink-0">vs base</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar rounded-b-xl">
          {shown === 0 && (
            <div className="py-8 text-center text-[12px] text-content/85">
              No cashiers matched.
            </div>
          )}

          {flat
            ? visible[0].cashiers.map((c) => (
                <CashierRow key={c.id} cashier={c} windows={windows} />
              ))
            : visible.map((s) => (
                <StoreSection key={s.storeid} store={s} windows={windows} />
              ))}
        </div>
      </div>
    </div>
  );
};

export default LpRosterPanel;
