import type { User } from "../../../../interfaces";
import type { UsersGridFilters } from "../../../../features/dev/devOrganizationSlice";

/** The company filter's value for "No company". */
export const NO_COMPANY_VALUE = "none";

/** The status filter's value for the inactive list. */
export const showsInactive = (f: UsersGridFilters) => f.statusFilter === "inactive";

/**
 * The users grid's filters, as one function.
 *
 * Lifted out of the grid so the header's Export can apply them while Add or
 * Edit is open: the export window used to live inside the grid, which isn't
 * mounted then, so Export did nothing.
 */
export const filterUsers = (users: User[], f: UsersGridFilters): User[] => {
  const lowerText = f.searchText.toLowerCase();
  return users.filter((u) => {
    const companyCheck =
      f.companyFilter === NO_COMPANY_VALUE
        ? u.companies.length === 0
        : f.companyFilter
          ? u.companies.some((c) => c.company === Number(f.companyFilter))
          : true;
    const levelCheck = f.levelFilter ? u.user_level === Number(f.levelFilter) : true;
    const roleCheck = f.roleFilter ? u.role === Number(f.roleFilter) : true;
    // Mixed and no-groups people match neither choice, only All: they are
    // not By group or By store, and the column says so.
    const accessCheck = !f.accessFilter
      ? true
      : f.accessFilter === "none"
        ? u.access_mode === null
        : u.access_mode === f.accessFilter;
    const firstName = (u.first_name ?? "").toLowerCase();
    const lastName = (u.last_name ?? "").toLowerCase();
    const fullName = `${firstName} ${lastName}`;
    const textCheck =
      f.searchText.trim() === ""
        ? true
        : firstName.includes(lowerText) ||
          lastName.includes(lowerText) ||
          fullName.includes(lowerText);
    const usernameCheck = f.usernameFilter.trim()
      ? u.username.toLowerCase().includes(f.usernameFilter.trim().toLowerCase())
      : true;
    const emailCheck = f.emailFilter.trim()
      ? (u.email ?? "").toLowerCase().includes(f.emailFilter.trim().toLowerCase())
      : true;
    return (
      companyCheck &&
      levelCheck &&
      roleCheck &&
      accessCheck &&
      textCheck &&
      usernameCheck &&
      emailCheck
    );
  });
};
