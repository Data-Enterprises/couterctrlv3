import { useState } from "react";
import { useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../utils";
import LpActionsEntry from "./LpActionsEntry";
import LpExceptionList from "./LpExceptionList";
import LpExceptionDetail from "./LpExceptionDetail";
import CashierJourney from "./CashierJourney";
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
  const walk = useLpExceptionWalk();
  const { singleDate, lastStore, lastGroup } = useAppSelector((s) => s.search);
  const { rows, searched, weeks, loading } = useAppSelector((s) => s.lpActions);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addingWeek, setAddingWeek] = useState(false);

  const run = (nextWeeks: number) => {
    if (!lastStore && !lastGroup) {
      toast.warn("Pick a store or group first");
      return;
    }
    setSearchOpen(false);
    return walk(formatGoliathDate(singleDate), nextWeeks);
  };

  const handleAddWeek = async () => {
    if (weeks >= MAX_WEEKS) {
      toast.warn(`${MAX_WEEKS} weeks is as far back as this goes`);
      return;
    }
    setAddingWeek(true);
    await run(weeks + 1);
    setAddingWeek(false);
  };

  if (!searched) {
    return <LpActionsEntry onRun={() => run(DEFAULT_WEEKS)} />;
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <LpExceptionList onSearchOpen={() => setSearchOpen(true)} />
        <LpExceptionDetail onAddWeek={handleAddWeek} addingWeek={addingWeek} />
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
          onMouseDown={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-[560px]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <LpActionsEntry
              onRun={() => run(DEFAULT_WEEKS)}
              onBack={() => setSearchOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LpActions;
