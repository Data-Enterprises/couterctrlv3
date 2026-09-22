import { useAppSelector } from "../../../../hooks";
import { isForbidden } from "../../../../api/sharedGroups";
import type { SharedGroupStore } from "../../../../interfaces";

/** Owner and up create, edit, share and delete shared groups; the router
 *  enforces the same level (403 below it). */
export const SHARED_GROUP_OWNER_LEVEL = 7;

/**
 * What the Shared Groups tab needs.
 *
 * Everyone sees the groups shared with them, read-only and cut down to the
 * stores they're assigned to. Owners and up also manage their own — shared
 * groups behave like user groups, except they can be handed to other people.
 */
export const useSharedGroupsCtx = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const { userid, userLevel } = useAppSelector((s) => s.user);
  return {
    url,
    token,
    userid,
    userLevel,
    canManage: userLevel >= SHARED_GROUP_OWNER_LEVEL,
  };
};

/** One store's label, the way every list on this tab prints it. */
export const storeLabel = (s: SharedGroupStore) =>
  [s.store_number, s.store_name ?? `Store ${s.storeid}`]
    .filter(Boolean)
    .join(" - ");

/** The router's level gate answers 403, not an envelope — say what it means. */
export const errorText = (err: unknown) =>
  isForbidden(err)
    ? "Managing shared groups needs owner level (7) or above."
    : ((err as { message?: string })?.message ?? "Something went wrong");
