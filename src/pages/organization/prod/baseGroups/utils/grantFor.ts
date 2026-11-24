// Interfaces
import type { GrantMode, User } from "../../../../../interfaces";

/**
 * How a group added on its Users sub-tab is granted to one person: a By store
 * person gets it By store with every store it holds today picked; everyone
 * else (no type on file, or Mixed included) gets it By group.
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
