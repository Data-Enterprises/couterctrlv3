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
    inactiveUsers,
    userInfo,
    refresh,
    selectedUserId,
    selectedUserForm,
    userLevels,
    userCompanyIds,
    availableUsernameText,
    usernameTextColor,
    availableEmailText,
    emailTextColor,
    selectedUserStores,
    duplicateSource,
  } = useAppSelector((state) => state.users);
  const { activeBaseGroups, inactiveBaseGroups, userCompany } = useAppSelector(
    (state) => state.baseGroup,
  );
  const {
    companies: companyRecords,
    refresh: companiesRefresh,
    usersExportOpen,
    baseGroupExportOpen,
    storesExportOpen,
    usersGridFilters,
  } = useAppSelector((state) => state.organization);

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
    inactiveUsers,
    userInfo,
    refresh,
    selectedUserId,
    selectedUserForm,
    userLevels,
    userCompanyIds,
    availableUsernameText,
    usernameTextColor,
    availableEmailText,
    emailTextColor,
    selectedUserStores,
    duplicateSource,
    activeBaseGroups,
    inactiveBaseGroups,
    userCompany,
    companyRecords,
    companiesRefresh,
    usersExportOpen,
    baseGroupExportOpen,
    storesExportOpen,
    usersGridFilters,
  };
};
