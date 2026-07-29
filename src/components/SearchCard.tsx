import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import StorePicker from "./storePicker/StorePicker";
import SingleDatePicker from "./datePickers/SingleDatePicker";
import DatePickers from "./datePickers/DatePickers";
import EntryCardLoading from "./loading/EntryCardLoading";
import { useAppSelector } from "../hooks";
import { getStoreName } from "../utils";

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
  /** Shown in the mask while loading. Worth naming what is being fetched —
   *  group searches can run long enough that a bare "Loading..." reads as a
   *  hang. */
  loadingMessage?: string;
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
  loadingMessage = "Loading...",
}: SearchCardProps) => {
  const search = useAppSelector((s) => s.search);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);

  // Echoed under the spinner. Derived here rather than passed in so every
  // caller gets it for free — the pickers already read the same slice.
  const searchLabel = [
    search.type === "Group"
      ? search.selectedGroup.group_name
      : getStoreName(
          assignedStores,
          search.selectedStore.storeid,
          search.selectedStore.store_name,
        ),
    singleDate
      ? search.singleDate
      : `${search.startDate} - ${search.endDate}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={
        top
          ? "mx-4 pt-4 pb-2"
          : "flex items-center justify-center min-h-[calc(100vh-3rem)] overflow-hidden mx-4 pb-12 md:pb-8"
      }
    >
      <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-content">{title}</h2>
          <p className="text-[12px] text-content/50 mt-1">{description}</p>
        </div>

        {/* A disabled button alone reads as a frozen form on slow group
            searches. While one runs the form stays mounted but unpainted, so
            the card holds its height and the spinner replaces it outright
            rather than sitting over a form you can still half see. */}
        <div className="relative flex flex-col gap-3">
          <div
            className="flex flex-col gap-3"
            style={loading ? { visibility: "hidden" } : undefined}
          >
            {notice && (
              <div className="px-2.5 py-2 rounded-lg bg-amber-50 text-[11.5px] text-amber-900 leading-snug">
                {notice}
              </div>
            )}

            <StorePicker />

            {singleDate ? <SingleDatePicker /> : <DatePickers showBtn={false} />}

            <button
              onClick={onSearch}
              disabled={loading}
              className="w-full py-2 text-sm font-semibold text-custom-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none disabled:opacity-50"
            >
              {buttonLabel}
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="w-full py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                style={{ background: "rgba(30,42,74,0.07)", borderRadius: 10 }}
              >
                <ArrowLeftIcon className="w-4 h-4 text-[#1e2a4a]" />
                <span className="text-[#1e2a4a] font-semibold text-[13px] underline underline-offset-2">
                  {backLabel}
                </span>
              </button>
            )}
          </div>

          {loading && (
            <EntryCardLoading message={loadingMessage} context={searchLabel} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchCard;
