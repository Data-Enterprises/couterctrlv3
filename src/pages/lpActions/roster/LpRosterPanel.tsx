import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setLpCase, setLpRosterSort } from "../../../features/lpActionsSlice";
import type { LpRosterSortCol } from "../../../features/lpActionsSlice";
import SortHeader from "../../../components/SortHeader";
import { ALL_TYPES } from "../case/caseModel";
import RosterHeader from "./RosterHeader";
import RosterChips from "./RosterChips";
import StoreSection from "./StoreSection";
import CashierRow from "./CashierRow";
import { buildRoster, filterRoster } from "./rosterModel";
import { sortRoster } from "./rosterSort";
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
/** This panel's column-header look, at its own 12px / 85% floor. */
const HEAD =
  "text-[12px] font-semibold uppercase tracking-wide text-content/85 hover:text-content flex-shrink-0";

interface Props {
  onSearchOpen: () => void;
}

const LpRosterPanel = ({ onSearchOpen }: Props) => {
  const dispatch = useAppDispatch();
  const { rawRows, windows, sevFilter, rosterQuery, rosterSort, caseSubject } =
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
    () => sortRoster(filterRoster(roster, sevFilter, rosterQuery), rosterSort),
    [roster, sevFilter, rosterQuery, rosterSort],
  );

  const shown = useMemo(
    () => visible.reduce((acc, s) => acc + s.cashiers.length, 0),
    [visible],
  );

  /**
   * Land on a STORE rather than on an empty right panel.
   *
   * The whole store, not its worst operator: a single-store search should open
   * on that store's own totals, and a group search should answer "which site"
   * before "which person". The roster is sorted worst first, so the first
   * store is the one to open either way.
   *
   * Only ever fires when nothing is selected — re-selecting on every filter
   * change would yank the case out from under someone mid-read.
   */
  const firstStore = visible[0];
  useEffect(() => {
    if (caseSubject || !firstStore) return;
    dispatch(
      setLpCase({
        ref: { storeid: firstStore.storeid, cashierNumber: null },
        type: ALL_TYPES,
      }),
    );
  }, [caseSubject, firstStore, dispatch]);

  /** One store in scope: the store row would be a header over a list of one,
   *  so it collapses away and the cashiers become the top-level list. */
  const flat = visible.length === 1;

  const onSort = (col: LpRosterSortCol) => dispatch(setLpRosterSort(col));

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm flex flex-col h-full">
        <RosterHeader count={shown} onSearchOpen={onSearchOpen} />
        <RosterChips counts={counts} />

        {/* Sortable, on the app's shared header. The size is this panel's
            12px floor rather than `PERF_SORT_HEADER`'s 11.5 — legibility
            beats matching a constant nobody reads. */}
        <div className="flex-shrink-0 flex items-center gap-2.5 px-3 py-1.5 bg-gray-100 border-b border-gray-100">
          <span className="w-2 flex-shrink-0" />
          <SortHeader
            col="name"
            label="Cashier"
            sort={rosterSort}
            onSort={onSort}
            className={`${HEAD} flex-1 min-w-0`}
          />
          <SortHeader
            col="weeks"
            label={`${windows.length} wks`}
            sort={rosterSort}
            onSort={onSort}
            width={46}
            className={`${HEAD} justify-center`}
          />
          <SortHeader
            col="total"
            label="Total"
            sort={rosterSort}
            onSort={onSort}
            width={72}
            className={`${HEAD} justify-end`}
          />
          <SortHeader
            col="base"
            label="vs base"
            sort={rosterSort}
            onSort={onSort}
            width={58}
            className={`${HEAD} justify-end`}
          />
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
