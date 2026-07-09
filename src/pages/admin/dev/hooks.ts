import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setCompanyForm } from "../../../features/adminPageSlice";

export const useAdminPageCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const {
    companies,
    companyForm,
    refresh,
    deleteCompanyModalOpen,
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
    companies,
    companyForm,
    refresh,
    deleteCompanyModalOpen,
    adminForm,
    companyStoresActivity,
    filteredStoresActivity,
    isLoadingStoreActivity,
    storeNameFilter,
  };
};

export const useAdminPageFormActions = () => {
  const dispatch = useAppDispatch();

  const setName = (x: string) => {
    dispatch(setCompanyForm({ key: "name", val: x }));
  };

  const setAddress = (x: string) => {
    dispatch(setCompanyForm({ key: "address", val: x }));
  };

  const setCity = (x: string) => {
    dispatch(setCompanyForm({ key: "city", val: x }));
  };

  const setState = (x: string) => {
    dispatch(setCompanyForm({ key: "state", val: x }));
  };

  const setZip = (x: string) => {
    dispatch(setCompanyForm({ key: "zip", val: Number(x) }));
  };

  const setPhone = (x: string) => {
    dispatch(setCompanyForm({ key: "phone", val: x }));
  };

  const setContactEmail = (x: string) => {
    dispatch(setCompanyForm({ key: "contact_email", val: x }));
  };

  return {
    setName,
    setAddress,
    setCity,
    setState,
    setZip,
    setPhone,
    setContactEmail,
  };
};
