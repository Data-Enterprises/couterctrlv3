import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useAdminPageCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  resetCompanyForm,
  setCompanyStoresActivity,
  setFilteredCompanyStoresActivity,
  setIsLoadingStoreActivity,
  setSelectedCompanyForm,
  setStoreNameFilter,
} from "../../../features/adminPageSlice";
import { getAllStoreActivity } from "../../../api/admin";
import type { JsonError, StoreActivityJsonResp } from "../../../interfaces";
import { formatGoliathDate } from "../../../utils";
import DatePickers from "../../../components/datePickers/DatePickers";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import TextFilter from "../../../components/filters/TextFilter";
import EmptyPrompt from "../../../components/EmptyPrompt";
import CompanyPicker from "./CompanyPicker";
import StoreActivityExportModal from "./StoreActivityExportModal";

interface StoreActivityCompProps {
  exportOpen: boolean;
  setExportOpen: (v: boolean) => void;
}

const StoreActivityComp = ({
  exportOpen,
  setExportOpen,
}: StoreActivityCompProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminPageCtx();
  const { startDate, endDate } = useAppSelector((state) => state.search);

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
    <div className="flex flex-1 min-h-0 w-[820px]">
      {exportOpen && (
        <StoreActivityExportModal
          onClose={() => setExportOpen(false)}
          companyName={context.companyForm.name}
          stores={context.companyStoresActivity}
        />
      )}

      <div className="flex flex-col flex-shrink-0">
        <CompanyPicker
          companies={context.companies}
          mode="select"
          selectedId={context.companyForm.id}
          onSelect={handleCompanySelect}
        />
        <div
          className="border-r border-gray-100 p-3 flex-shrink-0"
          style={{ width: "220px" }}
        >
          <DatePickers showBtn={false} stacked />
          <button
            onClick={fetchStoreActivity}
            disabled={context.companyForm.id === 0}
            className={`mt-2 w-full text-[12px] font-medium py-1.5 rounded-md transition-colors text-custom-white ${
              context.companyForm.id > 0
                ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Search
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
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
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-shrink-0">
              <TextFilter
                value={context.storeNameFilter}
                onChange={handleStoreNameFilter}
                placeholder="Search stores…"
              />
              <button
                onClick={handleMissingClick}
                className="text-[10px] font-medium text-[#1e2a4a] border border-gray-200 rounded-md px-2.5 py-1.5 flex-shrink-0"
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

            <div className="grid grid-cols-[0.6fr_2fr_1fr_1fr_1fr] px-4 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
              <div>ID</div>
              <div>Store name</div>
              <div className="text-right">Total days</div>
              <div className="text-right">Active</div>
              <div className="text-right">Missing</div>
            </div>
            <div className="max-h-96 overflow-y-auto thin-scrollbar">
              {context.filteredStoresActivity.map((s) => (
                <div
                  key={s.storeid}
                  className="grid grid-cols-[0.6fr_2fr_1fr_1fr_1fr] px-4 py-2 text-[12px] text-content border-b border-gray-100"
                >
                  <div>{s.storeid}</div>
                  <div className="truncate">{s.store_name}</div>
                  <div className="text-right">{s.total_days_in_range}</div>
                  <div className="text-right">{s.active_days}</div>
                  <div
                    className={`text-right ${s.inactive_or_missing_days > 0 ? "text-red-600 font-medium" : "text-content"}`}
                  >
                    {s.inactive_or_missing_days}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StoreActivityComp;
