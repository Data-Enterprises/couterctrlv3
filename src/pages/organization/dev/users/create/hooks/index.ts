// Hooks
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useToast } from "../../../../../../components/toasts/hooks/useToast";
import { useOrganizationCtx } from "../../../hooks";

// Redux
import {
  setSelectedUserStores,
  setUserCompanyIds,
} from "../../../../../../features/dev/devUsersSlice";

// API
import { getAllStoresInBaseGroup } from "../../../../../../api/baseGroups";
import { assignUserToCompany, getUserStores } from "../../../../../../api/user";
import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
  getBaseGroupsAssignedToUser,
  getUserGroupPicks,
} from "../../../../../../api/team";
import { getCompaniesAssignedToUser } from "../../../../../../api/company";

// Utils
import { heldGroupIds, picksForMode, changedSets, accessModeOf } from "../../utils";

// Interfaces
import type { AccessPicks, AccessSets, SelectableStore } from "../../interfaces";
import type { AccessOutcome, AccessStep, ExistingAccess, HeldRead } from "../interfaces";
import type {
  GrantMode,
  JsonError,
  Store,
  BaseGroup,
  UserGroupPick,
} from "../../../../../../interfaces";

/**
 * Edit's picks: seeded from what the person holds, re-seeded as those reads
 * land. After a save that stopped part way, `keepPicks` stops the re-seed, so
 * the admin's unsaved changes stay and Save changes still has them to send.
 */
export const useSeededPicks = (
  editing: boolean,
  held: AccessPicks,
  initial: AccessPicks,
) => {
  const [picks, setPicks] = useState<AccessPicks>(initial);
  const kept = useRef(false);

  useEffect(() => {
    if (!editing || kept.current) return;
    setPicks(held);
  }, [editing, held]);

  const keepPicks = useCallback(() => {
    kept.current = true;
  }, []);

  return { picks, setPicks, keepPicks };
};

/**
 * Changing how a person holds their groups (`picksForMode`), after making sure
 * every held group's roster is loaded: an unloaded roster contributes nothing,
 * which would strip that group's stores. Fetched rosters go back to the
 * caller's `groupStores`.
 */
export const useAccessMode = () => {
  const ctx = useOrganizationCtx();

  return useCallback(
    async (
      picks: AccessPicks,
      mode: GrantMode,
      groupStores: Record<number, Store[]>,
      onGroupStoresChange: (
        updater: (prev: Record<number, Store[]>) => Record<number, Store[]>,
      ) => void,
    ): Promise<AccessPicks> => {
      // Nothing to look up: `all` names no stores, and a mode that has not
      // changed cannot need any.
      if (mode === "all" || mode === picks.mode) {
        return picksForMode(picks, mode, groupStores);
      }

      const missing = heldGroupIds(picks).filter(
        (id) => groupStores[id] === undefined,
      );

      let rosters = groupStores;
      if (missing.length > 0) {
        const fetched = await Promise.all(
          missing.map((id) =>
            getAllStoresInBaseGroup(ctx.url, ctx.token, id)
              .then((resp) => {
                const j = resp.data;
                // A store with no name is dropped before it reaches a search
                // box, same as everywhere else that reads this endpoint.
                const stores: Store[] =
                  j.error === 0
                    ? (j.assigned_stores as Store[]).filter(
                        (s) => s.store_name != null,
                      )
                    : [];
                return [id, stores] as const;
              })
              // A roster that will not load leaves its group with no ticks,
              // which the panel shows as "0 of ?" rather than pretending.
              .catch((_err: JsonError) => [id, [] as Store[]] as const),
          ),
        );
        rosters = { ...groupStores };
        fetched.forEach(([id, stores]) => (rosters[id] = stores));
        onGroupStoresChange((prev) => {
          const next = { ...prev };
          fetched.forEach(([id, stores]) => {
            if (next[id] === undefined) next[id] = stores;
          });
          return next;
        });
      }

      return picksForMode(picks, mode, rosters);
    },
    [ctx.url, ctx.token],
  );
};

export const STEP_LABEL: Record<AccessStep, string> = {
  companies: "Companies",
  grants: "Base groups",
  revoke: "Removed base groups",
};

/**
 * Writing a person's access, shared by Add (after `create_user`) and Edit.
 *
 * Order:
 * 1. **Companies**: a grant outside the person's companies grants nothing.
 * 2. **Grants**, one call per group, each replacing what that group gave.
 * 3. **Revocations**, after the grants: a store is only removed when no group
 *    the person currently holds accounts for it, so East → South keeps it.
 *
 * Nothing writes `assigned` directly: such a store could never be revoked.
 * One call per group, because the endpoint takes one mode and one store list.
 * A group the panel never showed is never sent, so it is left as it was.
 */
export const useAccessSave = () => {
  const ctx = useOrganizationCtx();

  return useCallback(
    async (
      userid: number,
      sets: AccessSets,
      before: AccessSets,
    ): Promise<AccessOutcome> => {
      const changed = changedSets(sets, before);
      const saved: AccessStep[] = [];
      const skipped: AccessStep[] = [];

      const stop = (failed: AccessStep, reason: string): AccessOutcome => ({
        ok: false,
        saved,
        skipped,
        failed,
        reason,
      });

      /** A body with a non-zero `error` is a failure (with a toast), not a
       *  success. */
      const run = async (
        step: AccessStep,
        call: () => Promise<{ data: { error: number; msg?: string } }>,
        what?: string,
      ): Promise<string | null> => {
        try {
          const resp = await call();
          if (resp.data.error !== 0) {
            return (
              resp.data.msg ??
              `${what ?? STEP_LABEL[step]} was refused by the server.`
            );
          }
          return null;
        } catch (err) {
          return (err as JsonError).message;
        }
      };

      if (changed.companies) {
        const err = await run("companies", () =>
          assignUserToCompany(ctx.url, ctx.token, userid, sets.companyIds),
        );
        if (err) return stop("companies", err);
        saved.push("companies");
      } else {
        skipped.push("companies");
      }

      if (changed.grants.length > 0) {
        for (const g of changed.grants) {
          const err = await run(
            "grants",
            () =>
              assignBaseGroupToUser(
                ctx.url,
                ctx.token,
                userid,
                [g.groupid],
                g.mode,
                g.storeids,
              ),
            `Base group ${g.groupid}`,
          );
          if (err) return stop("grants", err);
        }
        saved.push("grants");
      } else {
        skipped.push("grants");
      }

      if (changed.revoke.length > 0) {
        const err = await run("revoke", () =>
          deleteUserBaseGroupLink(ctx.url, ctx.token, userid, changed.revoke),
        );
        if (err) return stop("revoke", err);
        saved.push("revoke");
      } else {
        skipped.push("revoke");
      }

      return { ok: true, saved, skipped, failed: null, reason: null };
    },
    [ctx.url, ctx.token],
  );
};

/** One sentence naming what landed and what did not, for the retry banner. */
export const outcomeSentence = (outcome: AccessOutcome) => {
  if (outcome.ok) return "";
  const done = outcome.saved.map((s) => STEP_LABEL[s].toLowerCase());
  const stopped = outcome.failed
    ? STEP_LABEL[outcome.failed].toLowerCase()
    : "";
  if (done.length === 0) return `No access saved — ${stopped} failed first.`;
  return `${done.join(" and ")} saved. ${stopped} did not.`;
};

/**
 * A "before" holding nothing, so every grant on Add reads as changed. A retry
 * reuses its real `before`, keeping its revocations.
 */
export const NOTHING_HELD: AccessSets = {
  companyIds: [],
  grants: [],
};

/**
 * What the selected user already holds, with two things kept out of the
 * panel's reach:
 *
 * - **Companies this editor can't see.** The company save REPLACES, so they
 *   are carried and added back at save time. Clear all leaves them alone.
 * - **Stores no base group explains** (direct `assigned` rows). Carried, shown
 *   as `direct`, never re-sent.
 *
 * Picks come from `/groups/user_group_picks` (which stores, through which
 * group). `heldGroups` is passed in: the dev base-group slice is never filled
 * in this tree.
 */
export const useExistingAccess = (
  heldGroups: BaseGroup[],
  groupPicks: UserGroupPick[],
): ExistingAccess => {
  const ctx = useOrganizationCtx();

  const visibleCompanyIds = useMemo(
    () =>
      new Set(
        ctx.isProgrammer
          ? ctx.allCompanies.map((c) => c.id)
          : ctx.companies.map((c) => c.company),
      ),
    [ctx.isProgrammer, ctx.allCompanies, ctx.companies],
  );

  return useMemo(() => {
    const stores = ctx.selectedUserStores.assigned;
    const seen = (companyId: number) => visibleCompanyIds.has(companyId);

    /** Company details for a picked store, which `user_group_picks` does not
     *  carry — joined from the stores the detail screen already loaded. */
    const storeById = new Map(stores.map((s) => [s.storeid, s]));

    /** Scoped to companies this editor can see — the panel cannot show the
     *  rest, so offering an edit to them would be an edit that never lands. */
    const visibleGroups = heldGroups.filter((g) => seen(g.company));
    const heldIds = new Set(visibleGroups.map((g) => g.id));

    /** The person's one answer, read back from rows that each carry their
     *  own. Shared with Duplicate, so the two cannot disagree. */
    const mode = accessModeOf(visibleGroups);

    /** Only picks for groups this editor can see: a group they can't send
     *  is not theirs to edit. */
    const pickedStores: SelectableStore[] = groupPicks
      .filter((p) => heldIds.has(p.groupid))
      .map((p) => {
        const store = storeById.get(p.storeid);
        return {
          storeid: p.storeid,
          store_number: p.store_number ?? store?.store_number ?? "",
          store_name: p.store_name ?? store?.store_name ?? "",
          company: store?.company ?? 0,
          company_name: store?.company_name ?? "",
          base_group: p.groupid,
        };
      });

    const pickedIds = new Set(pickedStores.map((s) => s.storeid));

    return {
      picks: {
        companies: ctx.userCompanyIds.filter(seen),
        baseGroups: visibleGroups.map((g) => g.id),
        mode,
        stores: pickedStores,
      },
      carried: {
        companies: ctx.userCompanyIds.filter((id) => !seen(id)),
        // Everything with no pick behind it: the direct assignments, plus the
        // rosters of groups held as `all` — neither is this panel's to write.
        stores: stores
          .filter((s) => !pickedIds.has(s.storeid))
          .map((s) => s.storeid),
      },
    };
  }, [
    visibleCompanyIds,
    ctx.userCompanyIds,
    heldGroups,
    ctx.selectedUserStores.assigned,
    groupPicks,
  ]);
};

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
 * What the grid row doesn't carry: the groups a person holds and how, their
 * stores, each pick's group, and their stored companies. All are needed before
 * Edit can be seeded. **A failed read says so**: the wizard shows Retry, and
 * Save stays off until `loaded`. `userid` 0 (Add) loads nothing.
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

    // The companies from the server, not the grid row: the company save
    // replaces the whole list, so it must start from what is stored.
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
