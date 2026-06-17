import StorePicker from "../../../components/storePicker/StorePicker";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";

interface LedgerSearchBarProps {
  onSearch: () => void;
  loading: boolean;
}

const LedgerSearchBar = ({ onSearch, loading }: LedgerSearchBarProps) => {
  return (
    <div className="bg-custom-white rounded-xl shadow-sm px-4 py-3 mb-4 flex items-end gap-4">
      <div className="flex-1">
        <StorePicker />
      </div>
      <div className="w-36">
        <SingleDatePicker />
      </div>
      <button
        onClick={onSearch}
        disabled={loading}
        className="btn-themeBlue py-1.5 px-6 text-sm whitespace-nowrap disabled:opacity-50"
      >
        {loading ? "Loading..." : "Search"}
      </button>
    </div>
  );
};

export default LedgerSearchBar;
