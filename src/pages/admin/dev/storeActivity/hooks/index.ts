// Hooks
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import {
  resetCompanyForm,
  setCompanyStoresActivity,
  setFilteredCompanyStoresActivity,
  setIsLoadingStoreActivity,
  setSelectedCompanyForm,
  setStoreNameFilter,
} from "../../../../../features/dev/devAdminPageSlice";

// API
import { getAllStoreActivity } from "../../../../../api/admin";

// Utils
import { formatGoliathDate } from "../../../../../utils";

// Interfaces
import type {
  JsonError,
  StoreActivityJsonResp,
} from "../../../../../interfaces";
import type { useAdminPageCtx } from "../../hooks";

/** Store activity's actions: pick a company, run the search, and narrow the
 *  rows to the missing ones, all of them, or a store name. */
export const useStoreActivity = (
  context: ReturnType<typeof useAdminPageCtx>,
) => {
  const toast = useToast();
  const { dispatch, startDate, endDate } = context;

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

  return {
    handleCompanySelect,
    fetchStoreActivity,
    handleMissingClick,
    handleAllClick,
    handleStoreNameFilter,
  };
};
