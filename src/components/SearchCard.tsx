import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import StorePicker from "./storePicker/StorePicker";
import SingleDatePicker from "./datePickers/SingleDatePicker";
import DatePickers from "./datePickers/DatePickers";

interface SearchCardProps {
  title: string;
  description: string;
  buttonLabel?: string;
  singleDate?: boolean;
  onSearch: () => void;
  loading: boolean;
  onBack?: () => void;
  backLabel?: string;
  top?: boolean;
  notice?: string;
}

const SearchCard = ({
  title,
  description,
  buttonLabel = "Search",
  singleDate = false,
  onSearch,
  loading,
  onBack,
  backLabel = "Back to results",
  top = false,
  notice,
}: SearchCardProps) => {
  return (
    <div className={top ? "mx-4 pt-4 pb-2" : "flex items-center justify-center min-h-[calc(100vh-3rem)] overflow-hidden mx-4 pb-12 md:pb-8"}>
      <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-content">{title}</h2>
          <p className="text-[12px] text-content/50 mt-1">{description}</p>
        </div>

        {notice && (
          <div className="px-2.5 py-2 rounded-lg bg-amber-50 text-[11.5px] text-amber-900 leading-snug">
            {notice}
          </div>
        )}

        <StorePicker />

        {singleDate ? (
          <SingleDatePicker />
        ) : (
          <DatePickers showBtn={false} />
        )}

        <button
          onClick={onSearch}
          disabled={loading}
          className="w-full py-2 text-sm font-semibold text-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none disabled:opacity-50"
        >
          {loading ? "Loading..." : buttonLabel}
        </button>

        {onBack && (
          <button
            onClick={onBack}
            className="w-full py-2.5 flex items-center justify-center gap-1.5 transition-colors"
            style={{ background: "rgba(30,42,74,0.07)", borderRadius: 10 }}
          >
            <ArrowLeftIcon className="w-4 h-4 text-[#1e2a4a]" />
            <span className="text-[#1e2a4a] font-semibold text-[13px] underline underline-offset-2">{backLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchCard;
