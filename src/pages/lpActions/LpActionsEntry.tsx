import { useAppSelector } from "../../hooks";
import SearchCard from "../../components/SearchCard";
import { DEFAULT_WEEKS } from "./lpActionsConfig";

/**
 * Store or group, and a date. `SearchCard` already owns both pickers and the
 * search slice behind them, so a group search costs this page nothing beyond
 * passing the scope through to the walk.
 */
interface Props {
  onRun: () => void;
  onBack?: () => void;
}

const LpActionsEntry = ({ onRun, onBack }: Props) => {
  const { loading, message, error } = useAppSelector((s) => s.lpActions);

  return (
    <SearchCard
      title="LP Actions"
      description={`Every exception type across a store or group, graded on what changed rather than what is highest. The ${DEFAULT_WEEKS} weeks ending on the chosen date: the last is judged against the ones before it, and the cashiers behind it are ranked by movement against their own normal.`}
      buttonLabel="Grade exceptions"
      singleDate
      onSearch={onRun}
      loading={loading}
      loadingMessage={message || "Reading exceptions…"}
      notice={error ?? undefined}
      onBack={onBack}
    />
  );
};

export default LpActionsEntry;
