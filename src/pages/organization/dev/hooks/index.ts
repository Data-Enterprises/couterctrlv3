// Hooks
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// API
import { getCompanies } from "../../../../api/company";

// Utils
// The same authority Admin gates company creation and deletion on: who may act
// on the tenancy itself. Assigning any company to any user is that same power,
// so it answers to that constant rather than to a second copy of the number.
import { PROGRAMMER_LEVEL } from "../../../../utils/userLevels";
import { seesEverything } from "../utils";

// Interfaces
import type { Company, JsonError, Store } from "../../../../interfaces";

export const useOrganizationCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { userid, userLevel, companies } = useAppSelector(
    (state) => state.user,
  );
  const {
    users,
    inactiveUsers,
    usersLoading,
    usersError,
    userInfo,
    userInfoBefore,
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
    unsavedWizard,
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
    usersLoading,
    usersError,
    userInfo,
    userInfoBefore,
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
    unsavedWizard,
  };
};

export type StoreSplit = { assigned: Store[]; unassigned: Store[] };

/**
 * What the Base Groups tab needs.
 *
 * Base groups are access only: a group is a set of stores, and assigning a
 * user to it grants them those stores. Nothing is shared or copied into the
 * user's own store groups — that is Shared Groups, a tab on the Groups page
 * with its own router.
 */
export const useBaseGroupsCtx = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const { userid, userLevel, email, companies } = useAppSelector((s) => s.user);
  return {
    url,
    token,
    userid,
    userLevel,
    /** Programmers and DCR support see every company; everyone else, their own.
     *  Defined once in `../utils`, because three tabs ask it. */
    canSeeAllCompanies: seesEverything(userLevel, email),
    ownCompanies: companies.map((c) => ({ id: c.company, name: c.name })),
    /** The same companies as membership rows, which carry the family. */
    ownMemberships: companies,
  };
};

/**
 * The companies this tab lists: the whole directory for programmers and DCR
 * support (fetched only for them), the user's own companies otherwise. The
 * base group calls take a bare company id with no ownership check on the
 * server, so the directory is never fetched for anyone else.
 */
export const useBaseGroupCompanies = () => {
  const ctx = useBaseGroupsCtx();
  const toast = useToast();
  const [all, setAll] = useState<Company[] | null>(null);

  useEffect(() => {
    if (!ctx.canSeeAllCompanies) return;
    getCompanies(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) setAll(j.companies);
      })
      .catch((err: JsonError) => toast.error(err.message));
  }, [ctx.canSeeAllCompanies, ctx.url, ctx.token]);

  return ctx.canSeeAllCompanies
    ? (all ?? []).map((c) => ({ id: c.id, name: c.name }))
    : ctx.ownCompanies;
};
