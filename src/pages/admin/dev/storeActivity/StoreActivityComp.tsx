// Hooks
import { useAdminPageCtx } from "../hooks";
import { useStoreActivity } from "./hooks";

// Components
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import EmptyPrompt from "../../../../components-dev/EmptyPrompt";
import StoreActivityExportModal from "./components/StoreActivityExportModal";
import ActivitySearchRail from "./components/ActivitySearchRail";
import ActivityFilterBar from "./components/ActivityFilterBar";
import ActivityHead from "./components/ActivityHead";
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
  const context = useAdminPageCtx();
  const {
    handleCompanySelect,
    fetchStoreActivity,
    handleMissingClick,
    handleAllClick,
    handleStoreNameFilter,
  } = useStoreActivity(context);
  const hasData = context.companyStoresActivity.length > 0;

  return (
    <div className="flex flex-1 min-h-0 w-full">
      {exportOpen && (
        <StoreActivityExportModal
          onClose={() => setExportOpen(false)}
          companyName={context.companyForm.name}
          stores={context.companyStoresActivity}
        />
      )}

      <ActivitySearchRail
        companies={context.companies}
        selectedId={context.companyForm.id}
        onSelect={handleCompanySelect}
        onSearch={fetchStoreActivity}
      />

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
            <ActivityFilterBar
              storeNameFilter={context.storeNameFilter}
              onFilter={handleStoreNameFilter}
              onMissing={handleMissingClick}
              onAll={handleAllClick}
            />
            <ActivityHead />
            <StoreRows />
          </>
        )}
      </div>
    </div>
  );
};

export default StoreActivityComp;
