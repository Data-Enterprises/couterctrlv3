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
 * Edit's picks: seeded from what the person holds, and re-seeded as those
 * reads land (they arrive a moment apart).
 *
 * **Except after a save that stopped part way.** The page re-reads what was
 * saved, and that used to re-seed the picks too: the admin's unsaved changes
 * were replaced by what had saved, nothing differed any more, and Save
 * changes went grey while the banner said to press it. `keepPicks` stops the
 * re-seed, so the re-read moves only the "before" side, and what didn't save
 * stays different and is what Save changes sends.
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
 * Changing how a person holds their groups.
 *
 * The arithmetic is `picksForMode`, which is pure and tested. What this adds
 * is the one thing it cannot do for itself: **make sure the rosters are
 * there first.**
 *
 * Switching to By store ticks each held group's whole roster, so the switch
 * starts as a no-op and the admin unticks from there. A roster that has not
 * loaded contributes nothing — which, left alone, would quietly take every
 * store off a group the panel simply had not browsed to yet. So every held
 * group's roster is fetched before the switch is applied, not after.
 *
 * Fetched rosters are handed back to the caller's `groupStores` as well, so
 * the panel that renders the new ticks does not fetch the same lists again.
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
 * Writing a person's access, shared by Add and Edit.
 *
 * Add runs `create_user` first and then this; Edit runs this on its own. One
 * routine either way, so the two cannot drift — the old wizard and the three
 * edit tabs each had their own copy of this sequence.
 *
 * ### Order, and why it is this order
 *
 * 1. **Companies**, because a base group belongs to one and a grant outside
 *    the person's companies grants nothing.
 * 2. **Grants**, one call per group, each replacing what that group gave.
 * 3. **Revocations**, after the grants and not before. The endpoint only
 *    removes a store when no other group the person *currently holds* still
 *    accounts for it, so a store moving from East to South survives if South
 *    is granted first. Revoke first and the same move loses the store for the
 *    moment in between — and permanently if the grant then fails.
 *
 * There is no fourth step. Nothing here writes `assigned` directly: a store
 * granted that way has no provenance, so no later group change could revoke
 * it, and re-sending such a list after a revocation would put back precisely
 * what the revocation removed.
 *
 * ### One call per group
 *
 * `assign_base_group_to_user` takes a list of group ids but a single mode and
 * a single store list, so a person holding East as `all` and South as
 * `selected` cannot be written in one call. Each group goes on its own, which
 * also means a failure names the group it failed on.
 *
 * A group the panel never showed is never sent. The call replaces one group
 * at a time, so silence about a group leaves it exactly as it was — which is
 * the only correct thing to do with picks this editor could not see.
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

      /** A body with a non-zero `error` is a failure, not a success with a
       *  note — it used to be a bare return with no toast, so the common case
       *  (an account created with no access) looked like nothing happening. */
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
 * A "before" holding nothing, for a person who holds nothing yet.
 *
 * Add user passes this so every grant reads as changed. A retry passes the
 * same `before` it used the first time instead: each call replaces its own
 * group, so re-running the same diff writes the same result, and keeping the
 * real `before` keeps any revocations in the retry too.
 */
export const NOTHING_HELD: AccessSets = {
  companyIds: [],
  grants: [],
};

/**
 * What the selected user already holds.
 *
 * ### Two kinds of thing are kept out of the panel's reach
 *
 * **Companies this editor cannot see.** Every column is scoped — a level 7 is
 * offered their own companies and the stores inside them — while the company
 * save REPLACES. An id merely absent from the screen would be removed by the
 * next save, so it is carried and added back at save time. `Clear all` empties
 * the picks and leaves the carried set alone, which is right: you cannot clear
 * what you were never shown.
 *
 * **Stores no base group explains.** These are direct assignments — rows in
 * `assigned` with no `assigned_via` behind them, from before groups granted
 * anything, or written by hand. Nothing on this screen granted them and no
 * group change can revoke them, so they are carried rather than picked: they
 * show in the effective list as `direct` and are never re-sent.
 *
 * ### Where the picks come from now
 *
 * `groupPicks` is `/groups/user_group_picks`, which says which stores were
 * selected and through which group. Before it existed this hook tagged every
 * store with group 0 and left a comment admitting the guess — a store from
 * `users/stores` carried no group, and inventing one assigned a group nobody
 * chose. The provenance is real now, so the guess is gone.
 *
 * `heldGroups` is passed in rather than read from the base-group slice. The
 * dev slice's `setUserBaseGroups` is dispatched by nothing in this tree — only
 * the legacy pages fill their own copy — so `activeBaseGroups` was always
 * empty here. Every user looked as though they held no groups, which made the
 * panel show nothing and a save re-grant everything.
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

    /** Only picks for groups this editor can see. A pick inside a company they
     *  cannot reach belongs to a group they cannot send, so showing it would
     *  offer an edit that never leaves. */
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
