import SearchCard from "../../../components/SearchCard";

interface LedgerEntryCardProps {
  onSearch: () => void;
  loading: boolean;
}

const LedgerEntryCard = ({ onSearch, loading }: LedgerEntryCardProps) => {
  return (
    <SearchCard
      title="Weekly Sales Performance"
      description="Select a store/group and week ending date to load your ledger."
      buttonLabel="Load Stores"
      singleDate
      onSearch={onSearch}
      loading={loading}
    />
  );
};

export default LedgerEntryCard;
