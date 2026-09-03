import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../utils";
import LpActionsEntry from "./LpActionsEntry";
import LpExceptionList from "./LpExceptionList";
import LpExceptionDetail from "./LpExceptionDetail";
import CashierJourney from "./CashierJourney";
import CashierCase from "./case/CashierCase";
import { setLpCase } from "../../features/lpActionsSlice";
import { useLpExceptionWalk } from "./useLpExceptionWalk";
import { DEFAULT_WEEKS, MAX_WEEKS } from "./lpActionsConfig";

/**
 * LP Actions — which exceptions changed, and who moved.
 *
 * The page owns the walk the same way every other searched page owns its fetch.
 * "Add week" re-runs it with a longer span rather than fetching the one extra
 * week and stitching: the baseline is a mean over everything before the latest
 * week, so a new week changes every verdict on the page, not just the column
 * it added.
 */
const LpActions = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const walk = useLpExceptionWalk();
  const { singleDate, lastStore, lastGroup } = useAppSelector((s) => s.search);
  const { rows, searched, weeks, loading, caseCashier, selectedId } =
    useAppSelector((s) => s.lpActions);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addingWeek, setAddingWeek] = useState(false);

  /**
   * The modal stays up until the walk answers.
   *
   * It used to close first and then start the walk, which unmounted
   * `LpActionsEntry` — the only thing on this page that renders `loading` and
   * the progress message. With `searched` already true, that dropped the reader
   * straight onto the PREVIOUS search's rows with no indication anything was
   * happening, and they sat there, live and clickable, until the new ones
   * landed. On a different store that is not a slow page, it is the wrong
   * answer presented as the right one.
   *
   * A failed walk keeps the card open too, so the error appears on the form
   * that caused it rather than over stale results.
   */
  const run = async (nextWeeks: number, fresh = true) => {
    if (!lastStore && !lastGroup) {
      toast.warn("Pick a store or group first");
      return false;
    }
    const ok = await walk(formatGoliathDate(singleDate), nextWeeks, fresh);
    if (ok) setSearchOpen(false);
    return ok;
  };

  const handleAddWeek = async () => {
    if (weeks >= MAX_WEEKS) {
      toast.warn(`${MAX_WEEKS} weeks is as far back as this goes`);
      return;
    }
    setAddingWeek(true);
    // Not fresh: same scope, wider window. The filter, the expanded groups and
    // the selected row all stay where the reader left them.
    await run(weeks + 1, false);
    setAddingWeek(false);
  };

  /**
   * The card owns the screen whenever there is nothing behind it to look at.
   *
   * That is the first search, and now also a re-search: clearing the slice when
   * the walk starts is what stops the previous store's rows being readable
   * mid-fetch, but it leaves the panels rendering their empty states — "Pick an
   * exception", an empty list — dimmed behind the popup. Empty furniture is not
   * better than stale data, it is just a different wrong answer.
   *
   * `rows.length` and not `loading` alone, so "add week" is unaffected: it
   * keeps its rows, so the page stays and the spinner lives on the detail
   * panel where the extra week is being added.
   */
  if (!searched || (loading && rows.length === 0)) {
    return <LpActionsEntry onRun={() => run(DEFAULT_WEEKS)} />;
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <LpExceptionList onSearchOpen={() => setSearchOpen(true)} />
        {caseCashier === null ? (
          <LpExceptionDetail
            onAddWeek={handleAddWeek}
            addingWeek={addingWeek}
          />
        ) : (
          <CashierCase
            onBack={() => dispatch(setLpCase(null))}
            backLabel={
              rows.find((r) => r.id === selectedId)?.saleType ?? "Exceptions"
            }
          />
        )}
      </div>

      {rows.length === 0 && !loading && (
        <p className="mt-3 text-[12px] text-content/85">
          No exceptions were flagged for this store over the {weeks} weeks
          ending on the searched date.
        </p>
      )}

      <CashierJourney />

      {searchOpen && (
        <div
          className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/35 p-4"
          onMouseDown={() => {
            if (!loading) setSearchOpen(false);
          }}
        >
          <div
            className="w-full max-w-[560px]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <LpActionsEntry
              onRun={() => run(DEFAULT_WEEKS)}
              onBack={loading ? undefined : () => setSearchOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LpActions;
