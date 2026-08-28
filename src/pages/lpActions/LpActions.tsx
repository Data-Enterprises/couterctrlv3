import { useState } from "react";
import { useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../utils";
import LpActionsEntry from "./LpActionsEntry";
import LpRosterPanel from "./roster/LpRosterPanel";
import CaseFilePanel from "./caseFile/CaseFilePanel";
import { useLpExceptionWalk } from "./useLpExceptionWalk";
import { DEFAULT_WEEKS } from "./lpActionsConfig";

/**
 * LP Actions — which exceptions changed, and who moved.
 *
 * The page owns the walk the same way every other searched page owns its fetch.
 * The span is fixed at `DEFAULT_WEEKS` — widening it from inside the page was
 * a control that re-ran the whole walk and changed every verdict on it, since
 * the baseline is a mean over everything before the latest week. A different
 * span is a different search.
 */
const LpActions = () => {
  const toast = useToast();
  const walk = useLpExceptionWalk();
  const { singleDate, lastStore, lastGroup } = useAppSelector((s) => s.search);
  const { rows, searched, weeks, loading } = useAppSelector(
    (s) => s.lpActions,
  );
  const [searchOpen, setSearchOpen] = useState(false);

  const run = (nextWeeks: number) => {
    if (!lastStore && !lastGroup) {
      toast.warn("Pick a store or group first");
      return;
    }
    setSearchOpen(false);
    return walk(formatGoliathDate(singleDate), nextWeeks);
  };

  if (!searched) {
    return <LpActionsEntry onRun={() => run(DEFAULT_WEEKS)} />;
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <LpRosterPanel onSearchOpen={() => setSearchOpen(true)} />
        <CaseFilePanel />
      </div>

      {rows.length === 0 && !loading && (
        <p className="mt-3 text-[12px] text-content/85">
          No exceptions were flagged for this store over the {weeks} weeks
          ending on the searched date.
        </p>
      )}

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
