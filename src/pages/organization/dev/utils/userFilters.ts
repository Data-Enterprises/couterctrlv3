// Interfaces
import type { UserSort } from "../interfaces";
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

/** A person's access type, as the grid's Access column and the export say it. */
export const accessLabel = (mode: User["access_mode"]) =>
  mode === "all"
    ? "By group"
    : mode === "selected"
      ? "By store"
      : mode === "mixed"
        ? "Mixed"
        : mode === null
          ? "Not set"
          : "—";

/**
 * Whether any of the grid's filters narrows the list. The status filter picks
 * the list itself (active or inactive), so it doesn't count. The export used
 * to compare counts instead, so a filter that happened to match everyone read
 * as "No filters currently applied".
 */
export const filtersApplied = (f: UsersGridFilters) =>
  [
    f.companyFilter,
    f.levelFilter,
    f.roleFilter,
    f.accessFilter,
    f.searchText.trim(),
    f.usernameFilter.trim(),
    f.emailFilter.trim(),
  ].some((v) => v !== "");

/**
 * The grid in a column's order. Rows came in API order with no way to sort.
 * Text compares as words; a missing value (no last visit, no role) goes last
 * either way, so the people who have never signed in don't lead a list
 * sorted by last visit.
 */
export const sortUsers = (
  users: User[],
  sort: UserSort | null,
  roleName: (role: number | null) => string,
): User[] => {
  if (!sort) return users;
  const value = (u: User): string | number | null => {
    switch (sort.key) {
      case "first":
        return (u.first_name ?? "").trim().toLowerCase() || null;
      case "last":
        return (u.last_name ?? "").trim().toLowerCase() || null;
      case "role":
        return roleName(u.role).toLowerCase() || null;
      case "level":
        return u.user_level;
      case "access":
        return accessLabel(u.access_mode).toLowerCase();
      case "visited":
        return u.last_visit;
    }
  };
  return [...users].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    const order =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
    return sort.desc ? -order : order;
  });
};
