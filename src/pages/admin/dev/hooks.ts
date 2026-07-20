import { useAppDispatch, useAppSelector } from "../../../hooks";

export const useAdminPageCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { userid } = useAppSelector((state) => state.user);
  const {
    companies,
    companyForm,
    refresh,
    adminForm,
    companyStoresActivity,
    filteredStoresActivity,
    isLoadingStoreActivity,
    storeNameFilter,
  } = useAppSelector((state) => state.adminPage);

  return {
    dispatch,
    url,
    token,
    userid,
    companies,
    companyForm,
    refresh,
    adminForm,
    companyStoresActivity,
    filteredStoresActivity,
    isLoadingStoreActivity,
    storeNameFilter,
  };
};
