import { useCallback } from "react";
import { useOrganizationCtx } from "../../hooks";
import { assignUserToCompany } from "../../../../../api/user";
import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
} from "../../../../../api/team";
import type { JsonError } from "../../../../../interfaces";
import type { AccessSets } from "./accessSets";
import { changedSets } from "./accessSets";

/** The stages of a save, in the order they have to be written. */
export type AccessStep = "companies" | "grants" | "revoke";

export const STEP_LABEL: Record<AccessStep, string> = {
  companies: "Companies",
  grants: "Base groups",
  revoke: "Removed base groups",
};

export interface AccessOutcome {
  ok: boolean;
  /** Written successfully, in the order they went out. */
  saved: AccessStep[];
  /** Skipped because nothing in that stage moved. */
  skipped: AccessStep[];
  /** Where it stopped. Null when everything asked for was written. */
  failed: AccessStep | null;
  /** Why it stopped, in words a person can act on. */
  reason: string | null;
}

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
