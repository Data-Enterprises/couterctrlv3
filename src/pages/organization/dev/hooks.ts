import { useAppDispatch, useAppSelector } from "../../../hooks";
// The same authority Admin gates company creation and deletion on: who may act
// on the tenancy itself. Assigning any company to any user is that same power,
// so it answers to that constant rather than to a second copy of the number.
import { PROGRAMMER_LEVEL } from "../../admin/dev/hooks";

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
    allCompanies,
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
    /** The companies the signed-in person holds, from the login response. */
    companies,
    /** Every company, fetched for programmers only — see devUsersSlice. */
    allCompanies,
    isProgrammer: userLevel === PROGRAMMER_LEVEL,
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
