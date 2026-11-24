// Hooks
import { useSearchPick } from "../../../../hooks";
import { useForecastCtx } from "../hooks";

// Redux
import { isGroupSearch } from "../../../../features/searchSlice";

// Utils
import { getStoreName } from "../../../../utils";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";
import StorePicker from "../../../../components-dev/storePicker/StorePicker";
import SingleDatePicker from "../../../../components-dev/datePickers/SingleDatePicker";
import EntryCardLoading from "../../../../components-dev/loading/EntryCardLoading";
import UpcField from "./components/UpcField";

interface ForecastEntryProps {
  onSearch: () => void;
  isLoading: boolean;
  loadingMessage?: string;
  /** Passed only when the card is a re-search overlay — shows a close button
   *  and drops the full-page centering, same contract as UpcSearchCard. */
  onClose?: () => void;
  /** Shown in the card, so a failed search explains itself where the user is
   *  already looking rather than in a toast they may have missed. */
  notice?: string;
}

/**
 * Forecast entry: UPC List's search card with one date (the endpoint walks 90
 * days back from it) and an AD list upload. AD prices are injected into the
 * price history before fitting, so they change every figure; their items carry
 * an AD badge.
 */
const ForecastEntry = ({
  onSearch,
  isLoading,
  loadingMessage = "Loading forecast...",
  onClose,
  notice,
}: ForecastEntryProps) => {
  const { nothingPicked, pickLabel } = useSearchPick();
  // Dev's own list — see the note in forecastDevSlice. Nothing loaded here
  // reaches the legacy page or the UPC List page.
  const { search, assignedStores, upcs } = useForecastCtx();

  // Echoed under the spinner, same derivation SearchCard uses.
  const searchLabel = [
    isGroupSearch(search.type)
      ? search.selectedGroup.group_name
      : getStoreName(
          assignedStores,
          search.selectedStore.storeid,
          search.selectedStore.store_name,
        ),
    search.singleDate,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={
        onClose
          ? "w-full max-w-sm"
          : "flex items-center justify-center min-h-[calc(100vh-3rem)] overflow-hidden mx-4 pb-12 md:pb-8"
      }
    >
      <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-2">
        {/* title */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-content">Forecast</h2>
            <p className="text-[12px] text-content/95">
              Ad-week units, revenue and markdown at a price you choose, from 90
              days of sales history
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close search"
              className="flex-shrink-0 -mt-1 -mr-1 p-1 rounded cc-muted-link hover:bg-brand_navy/10"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative flex flex-col gap-2">
          <div
            className="flex flex-col gap-2"
            style={isLoading ? { visibility: "hidden" } : undefined}
          >
            {notice && (
              <div className="cc-notice text-[11.5px] leading-snug">
                {notice}
              </div>
            )}

            {/* store / group */}
            <StorePicker />

            {/* the end of the history window */}
            <SingleDatePicker />

            {/* UPC input */}
            <UpcField />

            {/* run */}
            <button
              onClick={onSearch}
              disabled={!upcs.length || isLoading || nothingPicked}
              className="w-full py-2 text-sm font-semibold text-custom-white rounded-lg bg-brand_navy hover:bg-brand_navy_hover transition-colors cursor-pointer select-none disabled:opacity-50"
            >
              {nothingPicked
                ? pickLabel
                : upcs.length > 1
                  ? `Forecast ${upcs.length} items`
                  : "Forecast"}
            </button>
          </div>

          {isLoading && (
            <EntryCardLoading message={loadingMessage} context={searchLabel} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastEntry;
