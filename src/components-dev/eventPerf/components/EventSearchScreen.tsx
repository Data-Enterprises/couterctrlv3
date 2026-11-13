// Hooks
import { useAppDispatch } from "../../../hooks";
import { useEventPerfCtx } from "../hooks";

// Redux
import { setEventSearchOpen } from "../../../features/dev/devEventPerfSlice";

// Components
import SearchCard from "../../SearchCard";

interface EventSearchScreenProps {
  title: string;
  description: string;
  buttonLabel: string;
}

/** The search card: the first visit, a re-search over a loaded week, or a
 *  search that found nothing. */
const EventSearchScreen = ({ title, description, buttonLabel }: EventSearchScreenProps) => {
  const dispatch = useAppDispatch();
  const { perf, mine, hasResults, runSearch } = useEventPerfCtx();
  return (
    <div className="h-[calc(100dvh-3rem)] overflow-y-auto bg-bkg">
      <SearchCard
        top
        title={title}
        description={description}
        buttonLabel={buttonLabel}
        singleDate
        onSearch={runSearch}
        loading={mine && perf.loading}
        loadingMessage="Loading..."
        // Opened over a week already loaded, the card needs a way back to it
        // that is not a search — changing the picker alone loads nothing.
        onBack={
          hasResults
            ? () => dispatch(setEventSearchOpen(false))
            : undefined
        }
        notice={
          mine && perf.hasSearched && perf.rows.length === 0
            ? "Nothing found for that search."
            : undefined
        }
      />
    </div>
  );
};

export default EventSearchScreen;
