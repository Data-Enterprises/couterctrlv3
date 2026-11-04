import type { GrantMode, User } from "../../../../interfaces";

/**
 * How a group added on its Users sub-tab is granted to one person: in their
 * own access type.
 *
 * It was always By group, so a By store person came out Mixed: their next
 * Edit read them as By store, showed the new group with no store picked, and
 * blocked Save until stores were picked. Now a By store person gets the group
 * By store with every store it holds today picked, and everyone else gets it
 * By group as before. Someone with no type on file, or already Mixed, keeps
 * the old By group grant.
 */
export const grantFor = (
  user: Pick<User, "access_mode"> | undefined,
  groupStoreIds: number[],
): { mode: GrantMode; storeids?: number[] } =>
  user?.access_mode === "selected"
    ? { mode: "selected", storeids: groupStoreIds }
    : { mode: "all" };

/** The person's access type, as the list shows it beside their name. */
export const accessTypeLabel = (user: Pick<User, "access_mode"> | undefined) =>
  user?.access_mode === "selected"
    ? "By store"
    : user?.access_mode === "all"
      ? "By group"
      : user?.access_mode === "mixed"
        ? "Mixed"
        : "No type on file";
