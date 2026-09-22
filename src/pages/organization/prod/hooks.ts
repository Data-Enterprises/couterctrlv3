import { useAppDispatch, useAppSelector } from "../../../hooks";

export const useOrganizationCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
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
  } = useAppSelector((state) => state.prod.users);
  const { activeBaseGroups, inactiveBaseGroups, userCompany } = useAppSelector(
    (state) => state.prod.baseGroup,
  );
  const {
    companies: companyRecords,
    refresh: companiesRefresh,
    usersExportOpen,
    baseGroupExportOpen,
    storesExportOpen,
    usersGridFilters,
  } = useAppSelector((state) => state.prod.organization);

  return {
    dispatch,
    url,
    token,
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
