import StorePicker from "../../../components/storePicker/StorePicker";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";

interface LedgerEntryCardProps {
  onSearch: () => void;
  loading: boolean;
}

const LedgerEntryCard = ({ onSearch, loading }: LedgerEntryCardProps) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="bg-custom-white rounded-2xl shadow-lg p-8 w-full max-w-sm flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-content">
            Weekly Performance Ledger
          </h2>
          <p className="text-[12px] text-content/50 mt-1">
            Select a store or group and the week ending date to load your ledger.
          </p>
        </div>

        <StorePicker />

        <SingleDatePicker />

        <button
          onClick={onSearch}
          disabled={loading}
          className="btn-themeBlue w-full py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load Ledger"}
        </button>
      </div>
    </div>
  );
};

export default LedgerEntryCard;
