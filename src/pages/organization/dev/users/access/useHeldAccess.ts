import { useCallback, useEffect, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../../../api/user";
import {
  getBaseGroupsAssignedToUser,
  getUserGroupPicks,
} from "../../../../../api/team";
import { setSelectedUserStores } from "../../../../../features/dev/devUsersSlice";
import type {
  BaseGroup,
  JsonError,
  Store,
  UserGroupPick,
} from "../../../../../interfaces";

/**
 * The three things the grid row does not carry: the base groups a person
 * holds and how, their stores, and which group each picked store came
 * through.
 *
 * All three are needed before Edit can be seeded. Without the groups the
 * screen shows an empty panel for somebody who holds plenty — the bug that
 * made a freshly granted group look like it had never saved. Without the
 * picks every store looks direct, and the save then revokes nothing.
 *
 * `userid` of 0 loads nothing, which is what Add user passes: a person who
 * does not exist yet holds nothing to read back.
 */
export const useHeldAccess = (userid: number) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();

  const [heldGroups, setHeldGroups] = useState<BaseGroup[]>([]);
  const [groupPicks, setGroupPicks] = useState<UserGroupPick[]>([]);

  const reload = useCallback(() => {
    if (!userid) return;
    getBaseGroupsAssignedToUser(ctx.url, ctx.token, userid)
      .then((resp) => {
        const j = resp.data;
        // `active` is already the held half — the endpoint splits them, and
        // `inactive` is what they could be given rather than what they have.
        setHeldGroups(j.error === 0 ? ((j.active ?? []) as BaseGroup[]) : []);
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching base groups " + err.message),
      );

    const noNulls = (arr: Store[]) => arr.filter((s) => s.store_name !== null);
    getUserStores(ctx.url, ctx.token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) return;
        ctx.dispatch(
          setSelectedUserStores({
            assigned: noNulls(j.assigned_stores),
            unassigned: noNulls(j.unassigned_stores),
          }),
        );
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching stores " + err.message),
      );

    getUserGroupPicks(ctx.url, ctx.token, userid)
      .then((resp) => {
        const j = resp.data;
        setGroupPicks(j.error === 0 ? (j.data ?? []) : []);
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching store picks " + err.message),
      );
    // `ctx` and `toast` are rebuilt every render; what the reads depend on is
    // who and where.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userid, ctx.url, ctx.token]);

  useEffect(reload, [reload]);

  return { heldGroups, groupPicks, reload };
};
