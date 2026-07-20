import { useAppDispatch, useAppSelector } from "../../hooks";

export const useOrganizationCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isDesktop, isTablet } = useAppSelector(
    (state) => state.app,
  );
  const { userid, userLevel, companies } = useAppSelector(
    (state) => state.user,
  );
  const {
    users,
    userInfo,
    refresh,
    selectedUserId,
    selectedUserForm,
    userLevels,
    userCompanyIds,
    isDeletingUser,
    userFilterText,
    userFilterType,
    selectedCompanyId,
    availableUsernameText,
    usernameTextColor,
    availableEmailText,
    emailTextColor,
    selectedUserStores,
  } = useAppSelector((state) => state.users);
  const {
    baseGroups,
    selectedBaseGroups,
    company,
    activeBaseGroups,
    inactiveBaseGroups,
    userCompany,
  } = useAppSelector((state) => state.baseGroup);
  const { companies: companyRecords, refresh: companiesRefresh } =
    useAppSelector((state) => state.organization);

  return {
    dispatch,
    url,
    token,
    isDesktop,
    isTablet,
    userid,
    userLevel,
    companies,
    users,
    userInfo,
    refresh,
    selectedUserId,
    selectedUserForm,
    userLevels,
    userCompanyIds,
    isDeletingUser,
    userFilterText,
    userFilterType,
    selectedCompanyId,
    availableUsernameText,
    usernameTextColor,
    availableEmailText,
    emailTextColor,
    selectedUserStores,
    baseGroups,
    selectedBaseGroups,
    company,
    activeBaseGroups,
    inactiveBaseGroups,
    userCompany,
    companyRecords,
    companiesRefresh,
  };
};
