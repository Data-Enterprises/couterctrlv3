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
  } = useAppSelector((state) => state.dev.users);
  const { activeBaseGroups, inactiveBaseGroups, userCompany } = useAppSelector(
    (state) => state.dev.baseGroup,
  );
  const {
    usersExportOpen,
    usersGridFilters,
  } = useAppSelector((state) => state.dev.organization);

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
    usersExportOpen,
    usersGridFilters,
  };
};
