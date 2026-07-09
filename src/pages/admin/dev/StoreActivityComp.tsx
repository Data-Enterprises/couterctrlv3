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
import ExportModal from "../../../components/modals/ExportModal";
import { storeActivityColumns } from "..";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import TextFilter from "../../../components/filters/TextFilter";
import CompanyPicker from "./CompanyPicker";

interface StoreActivityCompProps {
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  exportOpen: boolean;
  setExportOpen: (v: boolean) => void;
}

const StoreActivityComp = ({ searchOpen, setSearchOpen, exportOpen, setExportOpen }: StoreActivityCompProps) => {
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
          setSearchOpen(false);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching store activity. " + err.message),
      )
      .finally(() => dispatch(setIsLoadingStoreActivity(false)));
  };

  const handleMissingClick = () => {
    const missing = context.companyStoresActivity.filter((s) => s.inactive_or_missing_days > 0);
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

  const SearchPanel = () => (
    <div className="flex flex-1 min-h-0">
      <CompanyPicker companies={context.companies} mode="select" selectedId={context.companyForm.id} onSelect={handleCompanySelect} />
      <div className="flex-1 p-5">
        <div className="text-[13px] font-semibold text-content mb-0.5">
          {context.companyForm.id > 0 ? context.companyForm.name : "Select a company"}
        </div>
        <div className="text-[11px] text-content mb-4">Choose a date range and search</div>
        <div className="max-w-sm space-y-3">
          <DatePickers showBtn={false} />
          <button
            onClick={fetchStoreActivity}
            disabled={context.companyForm.id === 0}
            className={`text-[11px] font-medium px-4 py-1.5 rounded-md transition-colors text-white ${
              context.companyForm.id > 0 ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        data={context.filteredStoresActivity}
        columns={storeActivityColumns}
      />

      {!hasData && !context.isLoadingStoreActivity ? (
        <SearchPanel />
      ) : context.isLoadingStoreActivity ? (
        <div className="flex-1 relative"><LoadingIndicator message="Loading store activity" /></div>
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
            <button onClick={handleAllClick} className="text-[10px] font-medium text-content px-2.5 py-1.5 flex-shrink-0">
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
          <div className="flex-1 overflow-y-auto thin-scrollbar">
            {context.filteredStoresActivity.map((s) => (
              <div
                key={s.storeid}
                className="grid grid-cols-[0.6fr_2fr_1fr_1fr_1fr] px-4 py-2 text-[11px] text-content border-b border-gray-100"
              >
                <div>{s.storeid}</div>
                <div className="truncate">{s.store_name}</div>
                <div className="text-right">{s.total_days_in_range}</div>
                <div className="text-right">{s.active_days}</div>
                <div className={`text-right ${s.inactive_or_missing_days > 0 ? "text-red-600 font-medium" : "text-content"}`}>
                  {s.inactive_or_missing_days}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden"
            style={{ height: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <SearchPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreActivityComp;
