import { useAppDispatch, useAppSelector } from "../../hooks";
import { getGroups } from "../../api/groups";
import { getUserStores } from "../../api/user";
import {
  setAssignedStores,
  setUnassignedStores,
} from "../../features/userSlice";
import { setAllAvailableStores } from "../../features/storeSlice";
import { normalizeUserStores } from "../../utils/storeIdentity";
import type { Store } from "../../interfaces";
import { setGroups } from "../../features/groupSlice";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";

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
    authorizedBaseGroupIds,
    baseGroupUserStatus,
    baseGroupShareSummary,
    baseGroupSelectedUserIds,
    baseGroupSelectionResetKey,
    pendingBaseGroupAction,
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
    authorizedBaseGroupIds,
    baseGroupUserStatus,
    baseGroupShareSummary,
    baseGroupSelectedUserIds,
    baseGroupSelectionResetKey,
    pendingBaseGroupAction,
  };
};

// Reloads the logged-in user's own store groups. Base group actions can create,
// rename, or tear down a store group belonging to whoever is driving the page,
// and groupSlice is otherwise only filled at login — so anything that can touch
// the acting user's groups has to pull them again or their picker stays wrong
// for the rest of the session.
export const useRefreshUserGroups = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useAppSelector((state) => state.app);

  return () => {
    getGroups(url, token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) dispatch(setGroups(j.groups));
      })
      .catch((err: JsonError) => toast.error(err.message));
  };
};

// Reloads the logged-in user's own store access. A base group delete unshares
// it from everyone holding it, revoking any store no other base group of theirs
// still grants — so the acting user's assigned stores can shrink out from under
// the copy userSlice has been holding since login.
export const useRefreshUserStores = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useAppSelector((state) => state.app);
  const { userid } = useAppSelector((state) => state.user);

  return () => {
    if (!userid) return;
    getUserStores(url, token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) return;
        dispatch(
          setAllAvailableStores(
            normalizeUserStores<Store>(j.all_stores_for_user ?? []),
          ),
        );
        dispatch(
          setAssignedStores(normalizeUserStores<Store>(j.assigned_stores)),
        );
        dispatch(
          setUnassignedStores(normalizeUserStores<Store>(j.unassigned_stores)),
        );
      })
      .catch((err: JsonError) =>
        toast.error("Error getting user stores: " + err.message),
      );
  };
};
