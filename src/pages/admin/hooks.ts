import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { setCompanyForm } from "../../features/adminSlice";

export const useAdminContext = () => {
  const { url, token } = useAppSelector((state) => state.app);
  const {
    companies,
    baseGroups,
    users,
    filteredUsers,
    deleteCompanyModalOpen,
    userNameFilter,
    companyFilter,
    adminOption,
    selectedUser,
    dropdownCompanies,
    companyForm,
    refresh,
    adminForm,
    companyStoresActivity,
    filteredStoresActivity,
    isLoadingStoreActivity,
    storeNameFilter,
  } = useAppSelector((state) => state.admin);

  return {
    adminOption,
    baseGroups,
    companies,
    companyFilter,
    companyForm,
    deleteCompanyModalOpen,
    dropdownCompanies,
    filteredUsers,
    refresh,
    selectedUser,
    token,
    url,
    userNameFilter,
    users,
    adminForm,
    companyStoresActivity,
    isLoadingStoreActivity,
    filteredStoresActivity,
    storeNameFilter,
  };
};

export const useControlsScrollHeight = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const calcScrollHeight = () => {
      if (containerRef.current && scrollRef.current) {
        const bottom = containerRef.current.getBoundingClientRect().bottom;
        const top = scrollRef.current.getBoundingClientRect().top;

        setHeight(bottom - top);
      }
    };

    calcScrollHeight();
    window.addEventListener("resize", calcScrollHeight);
    return () => {
      window.removeEventListener("resize", calcScrollHeight);
    };
  }, [scrollRef, containerRef]);

  return { scrollRef, containerRef, height };
};

export const useAdminFormActions = () => {
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