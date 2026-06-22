import { useAppSelector } from "../../../hooks";
import StorePicker from "../../../components/storePicker/StorePicker";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";

interface LedgerEntryScreenProps {
  onSearch: () => void;
  loading: boolean;
}

const LedgerEntryScreen = ({ onSearch, loading }: LedgerEntryScreenProps) => {
  const search = useAppSelector((s) => s.search);
  const hasSelection = search.type === "Store" ? search.lastStore > 0 : search.lastGroup > 0;

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50">
      <div className="px-5 pt-10 pb-6">
        <div className="text-content text-[20px] font-semibold">Weekly Performance</div>
        <div className="text-content/65 text-[12px] mt-1">Select a store or group and end date</div>
      </div>
      <div className="mx-4 bg-white rounded-2xl px-4 py-5 flex flex-col gap-4 shadow-sm border border-gray-100">
        <StorePicker />
        <SingleDatePicker />
        <button
          onClick={onSearch}
          disabled={!hasSelection || loading}
          className="w-full bg-[#1e2a4a] text-white font-semibold text-[14px] py-3.5 rounded-xl disabled:opacity-40 transition-opacity"
        >
          {loading ? "Loading…" : "Load stores"}
        </button>
      </div>
    </div>
  );
};

export default LedgerEntryScreen;
