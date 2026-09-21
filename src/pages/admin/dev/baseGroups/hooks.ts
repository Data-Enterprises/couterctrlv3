import type { Store } from "../../../../interfaces";
import { useAdminPageCtx } from "../hooks";

export type StoreSplit = { assigned: Store[]; unassigned: Store[] };

/**
 * What the Base Groups tab needs from Admin.
 *
 * Base groups are access only: a group is a set of stores, and assigning a
 * user to it grants them those stores. Nothing is shared or copied into the
 * user's own store groups — that is the job of Shared Groups, which is its own
 * tab and its own router.
 *
 * Companies come from Admin's own scoping, so this tab shows exactly the
 * companies the rest of Admin does: every company for programmers and DCR
 * support, the user's own companies for everyone else.
 */
export const useBaseGroupsCtx = () => {
  const admin = useAdminPageCtx();
  return {
    url: admin.url,
    token: admin.token,
    userLevel: admin.userLevel,
    companies: admin.companies.map((c) => ({ id: c.id, name: c.name })),
  };
};
