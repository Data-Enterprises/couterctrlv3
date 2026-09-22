import { useAppSelector } from "../../../../hooks";
import { isForbidden } from "../../../../api/sharedGroups";
import type { SharedGroupStore } from "../../../../interfaces";

/** Owner and up create, edit, share and delete shared groups; the router
 *  enforces the same level (403 below it). */
export const SHARED_GROUP_OWNER_LEVEL = 7;

/**
 * What the Shared Groups tab needs. The tab is owners and up only, and lists
 * the shared groups they created: a shared group is a user group its creator
 * can share. Anyone it's shared with sees it in their User Groups tab,
 * read-only.
 */
export const useSharedGroupsCtx = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const { userid, userLevel } = useAppSelector((s) => s.user);
  return { url, token, userid, userLevel };
};

/**
 * One store's label, the way every list on this tab prints it.
 *
 * Store names usually carry their number already ("027 - IGA GLASGOW KY"), so
 * the number is only added in front of a name that doesn't start with one —
 * otherwise it would read "27 - 027 - IGA GLASGOW KY".
 */
export const storeLabel = (s: SharedGroupStore) => {
  const name = s.store_name?.trim();
  if (!name) return s.store_number ? `Store ${s.store_number}` : `Store ${s.storeid}`;
  if (/^\d/.test(name) || !s.store_number) return name;
  return `${s.store_number} - ${name}`;
};

/** The router's rule for group names (routers/groups.py ALLOWED_GROUPNAME_PATTERN),
 *  checked here too so a bad name is caught while it's typed. */
const GROUP_NAME = /^[A-Za-z0-9 _-]+$/;

/** Why a name won't be accepted, or null if it will. */
export const nameProblem = (name: string): string | null => {
  const n = name.trim();
  if (!n) return "Give the group a name.";
  if (!GROUP_NAME.test(n)) return "Use only letters, numbers, spaces, _ and -.";
  return null;
};

/** The router's level gate answers 403, not an envelope — say what it means. */
export const errorText = (err: unknown) =>
  isForbidden(err)
    ? "Managing shared groups needs owner level (7) or above."
    : ((err as { message?: string })?.message ?? "Something went wrong");
