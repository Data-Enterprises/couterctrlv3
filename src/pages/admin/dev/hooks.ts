import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { isSupportUser } from "../../../utils/supportUsers";

/** The only level that may create, rename or delete a company. That changes the
 *  tenancy itself, not what someone is looking at, so it stays here alone. */
export const PROGRAMMER_LEVEL = 9;

/** Below this, Admin is not theirs to open at all. */
export const ADMIN_MIN_LEVEL = 5;

/**
 * Admin's flat context, scoped to the signed-in user.
 *
 * The narrowing lives here rather than in each tab so there is one place that
 * decides what a given user can see. A tab that forgets to filter is the kind
 * of omission nobody notices until the wrong person is looking at another
 * operator's stores.
 *
 * Worth being honest about what this is: it scopes the **UI**. The store
 * activity endpoint still answers for any company id it is handed, so this
 * stops a user reaching another operator's data through the interface, not
 * through the API.
 */
export const useAdminPageCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const {
    userid,
    userLevel,
    email,
    companies: userCompanies,
    assignedStores,
  } = useAppSelector((state) => state.user);
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

  /**
   * Two separate powers, deliberately not one flag.
   *
   * `canSeeAllStores` is about *visibility* — DCR's own support staff field
   * calls about stores they will never be assigned to, so assignment-based
   * scoping would work against them. `isProgrammer` is about *authority* over
   * the tenancy. Support gets the first and not the second.
   */
  const isProgrammer = userLevel === PROGRAMMER_LEVEL;
  const canSeeAllStores = isProgrammer || isSupportUser(email);
  const canOpenAdmin = userLevel >= ADMIN_MIN_LEVEL;

  /** Company ids this user is assigned to. `UserCompany.company` is the company
   *  id; `.id` is the assignment row, which is not the same number. */
  const allowedCompanyIds = useMemo(
    () => new Set(userCompanies.map((c) => c.company)),
    [userCompanies],
  );

  /** Null means no restriction, which is not the same as an empty set — an
   *  empty set is a real answer meaning "assigned to nothing". */
  const allowedStoreIds = useMemo(
    () =>
      canSeeAllStores ? null : new Set(assignedStores.map((s) => s.storeid)),
    [canSeeAllStores, assignedStores],
  );

  const scopedCompanies = useMemo(
    () =>
      canSeeAllStores
        ? companies
        : companies.filter((c) => allowedCompanyIds.has(c.id)),
    [canSeeAllStores, companies, allowedCompanyIds],
  );

  const scopedActivity = useMemo(
    () =>
      allowedStoreIds === null
        ? companyStoresActivity
        : companyStoresActivity.filter((s) => allowedStoreIds.has(s.storeid)),
    [allowedStoreIds, companyStoresActivity],
  );

  const scopedFiltered = useMemo(
    () =>
      allowedStoreIds === null
        ? filteredStoresActivity
        : filteredStoresActivity.filter((s) => allowedStoreIds.has(s.storeid)),
    [allowedStoreIds, filteredStoresActivity],
  );

  return {
    dispatch,
    url,
    token,
    userid,
    userLevel,
    isProgrammer,
    canSeeAllStores,
    canOpenAdmin,
    allowedStoreIds,
    companies: scopedCompanies,
    companyForm,
    refresh,
    adminForm,
    companyStoresActivity: scopedActivity,
    filteredStoresActivity: scopedFiltered,
    isLoadingStoreActivity,
    storeNameFilter,
  };
};
