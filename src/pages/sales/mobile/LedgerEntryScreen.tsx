import { useAppSelector, useAppDispatch } from "../../../hooks";
import { navigateToList, setHasSearched } from "../../../features/salesLedgerSlice";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import StorePicker from "../../../components/storePicker/StorePicker";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";

interface LedgerEntryScreenProps {
  onSearch: () => void;
  loading: boolean;
}

const LedgerEntryScreen = ({ onSearch, loading }: LedgerEntryScreenProps) => {
  const dispatch = useAppDispatch();
  const search = useAppSelector((s) => s.search);
  const hasData = useAppSelector((s) => s.sales.weeklySales.length > 0);
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
        {hasData && (
          <button
            onClick={() => { dispatch(setHasSearched(true)); dispatch(navigateToList()); }}
            className="w-full py-3 flex items-center justify-center gap-1.5 transition-opacity"
            style={{ background: "rgba(30,42,74,0.07)", borderRadius: 12 }}
          >
            <ArrowLeftIcon className="w-4 h-4 text-[#1e2a4a]" />
            <span className="text-[#1e2a4a] font-semibold text-[14px] underline underline-offset-2">Back to results</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LedgerEntryScreen;
