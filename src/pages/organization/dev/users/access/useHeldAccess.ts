import { useCallback, useEffect, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../../../api/user";
import { getCompaniesAssignedToUser } from "../../../../../api/company";
import {
  getBaseGroupsAssignedToUser,
  getUserGroupPicks,
} from "../../../../../api/team";
import {
  setSelectedUserStores,
  setUserCompanyIds,
} from "../../../../../features/dev/devUsersSlice";
import type {
  BaseGroup,
  JsonError,
  Store,
  UserGroupPick,
} from "../../../../../interfaces";

/** The four reads, by what the person holds that each one answers. */
export type HeldRead = "groups" | "stores" | "picks" | "companies";

const READ_NAMES: Record<HeldRead, string> = {
  groups: "base groups",
  stores: "stores",
  picks: "store picks",
  companies: "companies",
};

/** "base groups and stores", for the error line. */
export const failedReadsText = (failed: HeldRead[]) => {
  const names = failed.map((r) => READ_NAMES[r]);
  return names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};

/**
 * The things the grid row does not carry: the base groups a person holds and
 * how, their stores, which group each picked store came through, and their
 * companies as stored.
 *
 * All are needed before Edit can be seeded. Without the groups the screen
 * shows an empty panel for somebody who holds plenty — the bug that made a
 * freshly granted group look like it had never saved. Without the picks every
 * store looks direct, and the save then revokes nothing.
 *
 * **A read that fails says so.** A failed read used to become an empty list,
 * so the person looked as though they held nothing, and a save from that
 * screen would have acted on it. Now `failed` names it, the wizard shows an
 * error with Retry, and Save stays off until `loaded`.
 *
 * `userid` of 0 loads nothing, which is what Add user passes: a person who
 * does not exist yet holds nothing to read back.
 */
export const useHeldAccess = (userid: number) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();

  const [heldGroups, setHeldGroups] = useState<BaseGroup[]>([]);
  const [groupPicks, setGroupPicks] = useState<UserGroupPick[]>([]);
  const [pending, setPending] = useState<HeldRead[]>(() =>
    userid ? ["groups", "stores", "picks", "companies"] : [],
  );
  const [failed, setFailed] = useState<HeldRead[]>([]);

  const reload = useCallback(() => {
    if (!userid) return;
    const all: HeldRead[] = ["groups", "stores", "picks", "companies"];
    setPending(all);
    setFailed([]);

    const settle = (read: HeldRead, ok: boolean) => {
      setPending((p) => p.filter((r) => r !== read));
      if (!ok) setFailed((f) => (f.includes(read) ? f : [...f, read]));
    };
    const fail = (read: HeldRead, what: string) => (err: JsonError) => {
      settle(read, false);
      toast.error(`Error fetching ${what} ${err.message}`);
    };

    getBaseGroupsAssignedToUser(ctx.url, ctx.token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) return settle("groups", false);
        // `active` is already the held half — the endpoint splits them, and
        // `inactive` is what they could be given rather than what they have.
        setHeldGroups((j.active ?? []) as BaseGroup[]);
        settle("groups", true);
      })
      .catch(fail("groups", "base groups"));

    const noNulls = (arr: Store[]) => arr.filter((s) => s.store_name !== null);
    getUserStores(ctx.url, ctx.token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) return settle("stores", false);
        ctx.dispatch(
          setSelectedUserStores({
            assigned: noNulls(j.assigned_stores),
            unassigned: noNulls(j.unassigned_stores),
          }),
        );
        settle("stores", true);
      })
      .catch(fail("stores", "stores"));

    // The companies from the server, not the grid row the Edit was opened
    // from: the company save replaces the whole list, so it has to start from
    // what is really stored. A row read before a change on the Companies tab
    // would otherwise undo that change.
    getCompaniesAssignedToUser(ctx.url, ctx.token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) return settle("companies", false);
        ctx.dispatch(
          setUserCompanyIds(
            ((j.companies ?? []) as { company: number }[]).map((c) => c.company),
          ),
        );
        settle("companies", true);
      })
      .catch(fail("companies", "companies"));

    getUserGroupPicks(ctx.url, ctx.token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) return settle("picks", false);
        setGroupPicks(j.data ?? []);
        settle("picks", true);
      })
      .catch(fail("picks", "store picks"));
    // `ctx` and `toast` are rebuilt every render; what the reads depend on is
    // who and where.
  }, [userid, ctx.url, ctx.token]);

  useEffect(reload, [reload]);

  return {
    heldGroups,
    groupPicks,
    reload,
    /** Every read has answered, and none failed. True in Add. */
    loaded: !userid || (pending.length === 0 && failed.length === 0),
    /** The reads that failed, for the error line. */
    failed,
  };
};
