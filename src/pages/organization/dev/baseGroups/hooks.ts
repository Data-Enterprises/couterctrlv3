import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../hooks";
import { getCompanies } from "../../../../api/company";
import { isSupportUser } from "../../../../utils/supportUsers";
import type { Company, JsonError, Store } from "../../../../interfaces";
import { useToast } from "../../../../components/toasts/hooks/useToast";

export type StoreSplit = { assigned: Store[]; unassigned: Store[] };

/**
 * What the Base Groups tab needs.
 *
 * Base groups are access only: a group is a set of stores, and assigning a
 * user to it grants them those stores. Nothing is shared or copied into the
 * user's own store groups — that is Shared Groups, its own tab and router.
 */
export const useBaseGroupsCtx = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const { userLevel, email, companies } = useAppSelector((s) => s.user);
  return {
    url,
    token,
    userLevel,
    /** Programmers and DCR support see every company; everyone else, their own. */
    canSeeAllCompanies: userLevel === 9 || isSupportUser(email),
    ownCompanies: companies.map((c) => ({ id: c.company, name: c.name })),
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
