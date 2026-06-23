import { useAppSelector, useAppDispatch } from "../../../hooks";
import { navigateToList, setHasSearched } from "../../../features/salesLedgerSlice";
import SearchCard from "../../../components/SearchCard";

interface LedgerEntryScreenProps {
  onSearch: () => void;
  loading: boolean;
}

const LedgerEntryScreen = ({ onSearch, loading }: LedgerEntryScreenProps) => {
  const dispatch = useAppDispatch();
  const hasData = useAppSelector((s) => s.sales.weeklySales.length > 0);

  const handleBack = hasData
    ? () => { dispatch(setHasSearched(true)); dispatch(navigateToList()); }
    : undefined;

  return (
    <SearchCard
      title="Weekly Performance"
      description="Select a store or group and end date."
      buttonLabel="Load stores"
      singleDate
      onSearch={onSearch}
      loading={loading}
      onBack={handleBack}
      backLabel="Back to results"
    />
  );
};

export default LedgerEntryScreen;
