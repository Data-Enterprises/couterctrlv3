// Hooks
import { useAdminPageCtx } from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  resetCompanyForm,
  setCompanyStoresActivity,
  setFilteredCompanyStoresActivity,
  setIsLoadingStoreActivity,
  setSelectedCompanyForm,
  setStoreNameFilter,
} from "../../../../features/dev/devAdminPageSlice";

// API
import { getAllStoreActivity } from "../../../../api/admin";

// Utils
import { formatGoliathDate } from "../../../../utils";

// Interfaces
import type { JsonError, StoreActivityJsonResp } from "../../../../interfaces";

// Components
import DatePickers from "../../../../components-dev/datePickers/DatePickers";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import EmptyPrompt from "../../../../components-dev/EmptyPrompt";
import CompanyPicker from "./components/CompanyPicker";
import StoreActivityExportModal from "./components/StoreActivityExportModal";
import StoreRows from "./components/StoreRows";

interface StoreActivityCompProps {
  exportOpen: boolean;
  setExportOpen: (open: boolean) => void;
}

/** The Store Activity tab: pick a company and date range to see each store's total, active and missing sales
 *  days, with a store search. Shows an empty prompt until a search is run. */
const StoreActivityComp = ({
  exportOpen,
  setExportOpen,
}: StoreActivityCompProps) => {
  const toast = useToast();
  const context = useAdminPageCtx();
  const { dispatch, startDate, endDate } = context;
  const hasData = context.companyStoresActivity.length > 0;

  const handleCompanySelect = (id: number) => {
    const form = context.companies.find((c) => c.id === id);
    if (!form) return;
    dispatch(resetCompanyForm());
    dispatch(setStoreNameFilter(""));
    dispatch(setFilteredCompanyStoresActivity([]));
    dispatch(setCompanyStoresActivity([]));
    dispatch(setSelectedCompanyForm(form));
  };

  const fetchStoreActivity = () => {
    dispatch(setCompanyStoresActivity([]));
    dispatch(setIsLoadingStoreActivity(true));
    getAllStoreActivity(
      context.url,
      context.token,
      formatGoliathDate(startDate),
      formatGoliathDate(endDate),
      context.companyForm.id,
    )
      .then((resp) => {
        const j: StoreActivityJsonResp = resp.data;
        if (j.error === 0) {
          dispatch(setCompanyStoresActivity(j.stores));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching store activity. " + err.message),
      )
      .finally(() => dispatch(setIsLoadingStoreActivity(false)));
  };

  const handleMissingClick = () => {
    const missing = context.companyStoresActivity.filter(
      (s) => s.inactive_or_missing_days > 0,
    );
    dispatch(setFilteredCompanyStoresActivity(missing));
  };

  const handleAllClick = () => {
    dispatch(setFilteredCompanyStoresActivity(context.companyStoresActivity));
  };

  const handleStoreNameFilter = (val: string) => {
    dispatch(setStoreNameFilter(val));
    const filtered = context.companyStoresActivity.filter((s) =>
      s.store_name.toLowerCase().includes(val.toLowerCase()),
    );
    dispatch(setFilteredCompanyStoresActivity(filtered));
  };

  return (
    <div className="flex flex-1 min-h-0 w-full">
      {exportOpen && (
        <StoreActivityExportModal
          onClose={() => setExportOpen(false)}
          companyName={context.companyForm.name}
          stores={context.companyStoresActivity}
        />
      )}

      <div className="flex flex-col flex-shrink-0">
        <div
          className="border-r border-line_hair p-3 flex-shrink-0"
          style={{ width: "220px" }}
        >
          {/* `data-help` is what the help panel points at */}
          <div data-help="dates">
            <DatePickers showBtn={false} stacked />
          </div>
          <button
            data-help="search"
            onClick={fetchStoreActivity}
            disabled={context.companyForm.id === 0}
            className={`mt-2 w-full text-[12px] font-medium py-1.5 rounded-md transition-colors text-custom-white ${
              context.companyForm.id > 0
                ? "bg-brand_navy hover:bg-brand_navy/85"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Search
          </button>
        </div>
        <CompanyPicker
          helpAnchor="company"
          companies={context.companies}
          mode="select"
          selectedId={context.companyForm.id}
          onSelect={handleCompanySelect}
        />
      </div>

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        {!hasData && !context.isLoadingStoreActivity ? (
          <div className="min-h-[260px] p-5">
            <EmptyPrompt
              title="No store activity yet"
              description="Select a company and date range, then search"
            />
          </div>
        ) : context.isLoadingStoreActivity ? (
          <div className="min-h-[260px] relative">
            <LoadingIndicator message="Loading store activity" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-line_hair flex-shrink-0">
              <TextFilter
                value={context.storeNameFilter}
                onChange={handleStoreNameFilter}
                placeholder="Search stores…"
              />
              <button
                data-help="missing-filter"
                onClick={handleMissingClick}
                className="text-[10px] font-medium text-brand_navy border border-gray-200 rounded-md px-2.5 py-1.5 flex-shrink-0"
              >
                View all missing
              </button>
              <button
                onClick={handleAllClick}
                className="text-[10px] font-medium text-content px-2.5 py-1.5 flex-shrink-0"
              >
                View all
              </button>
            </div>

            <div
              data-help="activity-grid"
              className="grid grid-cols-[0.6fr_2fr_1fr_1fr_1fr] px-4 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0"
            >
              <div>ID</div>
              <div>Store name</div>
              <div className="text-right">Total days</div>
              <div className="text-right">Active</div>
              <div className="text-right">Missing</div>
            </div>
            <StoreRows />
          </>
        )}
      </div>
    </div>
  );
};

export default StoreActivityComp;
