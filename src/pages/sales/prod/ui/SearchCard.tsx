import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import StorePicker from "./storePicker/StorePicker";
import SingleDatePicker from "./datePickers/SingleDatePicker";
import DatePickers from "./datePickers/DatePickers";
import EntryCardLoading from "./loading/EntryCardLoading";
import { useAppSelector } from "../../../../hooks";
import { getStoreName } from "../../../../utils";
import type { ReactNode } from "react";
import { isGroupSearch } from "../../../../features/searchSlice";

interface SearchCardProps {
  title: string;
  description: string;
  buttonLabel?: string;
  singleDate?: boolean;
  /** Suppress the card's own date control entirely, for a page that owns its
   *  date rather than sharing `searchSlice`'s. Suggested Weight does: its date
   *  is the day an order is PLACED and defaults to today, while the shared one
   *  defaults a day back because every reporting page wants a complete day.
   *  Writing today into the shared slice to suit this page moved the week
   *  ending on every other one. */
  hideDates?: boolean;
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
  /** Extra inputs between the date picker and the search button, for pages
   *  whose search takes a parameter beyond store and date — the Sales Tracker
   *  window length, for one. Hidden by the loading mask with the rest of the
   *  form. */
  extraControls?: ReactNode;
}

const SearchCard = ({
  title,
  description,
  buttonLabel = "Search",
  singleDate = false,
  hideDates = false,
  onSearch,
  loading,
  onBack,
  backLabel = "Back to results",
  top = false,
  notice,
  loadingMessage = "Loading...",
  extraControls,
}: SearchCardProps) => {
  const search = useAppSelector((s) => s.search);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);

  /**
   * Nothing to search yet.
   *
   * Both sides start at id 0 — no store, no group — and every page here reads
   * the same slice, so one check covers all of them. Without it the button
   * fired a request for store 0, which comes back empty and reads as "this
   * week has no data" rather than "you haven't picked anywhere".
   */
  const searchingGroup = isGroupSearch(search.type);
  const nothingPicked = searchingGroup
    ? search.selectedGroup.id === 0
    : search.selectedStore.storeid === 0;

  // Echoed under the spinner. Derived here rather than passed in so every
  // caller gets it for free — the pickers already read the same slice.
  const searchLabel = [
    isGroupSearch(search.type)
      ? search.selectedGroup.group_name
      : getStoreName(
          assignedStores,
          search.selectedStore.storeid,
          search.selectedStore.store_name,
        ),
    hideDates
      ? ""
      : singleDate
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

            {!hideDates &&
              (singleDate ? <SingleDatePicker /> : <DatePickers showBtn={false} />)}

            {extraControls}

            <button
              onClick={onSearch}
              disabled={loading || nothingPicked}
              className="w-full py-2 text-sm font-semibold text-custom-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none disabled:opacity-50"
            >
              {/* The button says what it is waiting for rather than what it
                  will do, so the disabled state names the missing step instead
                  of only dimming. It becomes the page's own label the moment
                  there is something to search. */}
              {nothingPicked
                ? searchingGroup
                  ? "Select Group"
                  : "Select Store"
                : buttonLabel}
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
