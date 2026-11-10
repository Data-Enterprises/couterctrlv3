// Hooks
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";

// Redux
import { setPerfHasSearched } from "../../../../../../features/dev/devSalesPerfSlice";

// Components
import SearchCard from "../../../../../../components-dev/SearchCard";

interface PerfSearchScreenProps {
  onSearch: () => void;
}

/** The search card: the first visit, a return via the range chip, or a
 *  search that came back empty. */
const PerfSearchScreen = ({ onSearch }: PerfSearchScreenProps) => {
  const dispatch = useAppDispatch();
  const perf = useAppSelector((s) => s.dev.salesPerf);
  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden">
      <SearchCard
        top
        title="Weekly Sales"
        description="Select a store or group and end date."
        buttonLabel="Load sales"
        singleDate
        onSearch={onSearch}
        loading={perf.loading}
        loadingMessage="Finding sales..."
        onBack={
          // Only offered when there is something to go back TO. Landing here
          // for the first time has no results behind it.
          perf.weekTy.length > 0
            ? () => dispatch(setPerfHasSearched(true))
            : undefined
        }
        backLabel="Back to sales"
        notice={
          perf.hasSearched
            ? "No data found for that search — try a different store, group, or week."
            : undefined
        }
      />
    </div>
  );
};

export default PerfSearchScreen;
