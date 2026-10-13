import { useCallback } from "react";
import { useOrganizationCtx } from "../../hooks";
import { assignUserToCompany } from "../../../../../api/user";
import {
  assignBaseGroupToUser,
  assignUserToStore,
} from "../../../../../api/team";
import type { JsonError } from "../../../../../interfaces";
import type { AccessSets } from "./accessSets";

/** The three levels of access, in the order they have to be written. */
export type AccessStep = "companies" | "baseGroups" | "stores";

export const STEP_LABEL: Record<AccessStep, string> = {
  companies: "Companies",
  baseGroups: "Base groups",
  stores: "Stores",
};

export interface AccessOutcome {
  ok: boolean;
  /** Written successfully, in the order they went out. */
  saved: AccessStep[];
  /** Skipped because nothing in that list moved. */
  skipped: AccessStep[];
  /** Where it stopped. Null when everything asked for was written. */
  failed: AccessStep | null;
  /** Why it stopped, in words a person can act on. */
  reason: string | null;
}

export interface ChangedLists {
  companies: boolean;
  baseGroups: boolean;
  stores: boolean;
}

export const ALL_CHANGED: ChangedLists = {
  companies: true,
  baseGroups: true,
  stores: true,
};

/**
 * Writing a person's access, shared by Add and Edit.
 *
 * Add runs `create_user` first and then this; Edit runs this on its own. One
 * routine either way, so the two cannot drift — the old wizard and the three
 * edit tabs each had their own copy of this sequence.
 *
 * Order matters and is not alphabetical: a base group belongs to a company
 * and a store sits under a base group, so each call is written after the
 * thing it depends on.
 *
 * **Every call sends the whole intended set**, because all three endpoints
 * replace rather than append. That is also what makes a retry safe: re-sending
 * a list that already saved writes the same list again.
 *
 * A non-zero `error` in the body is a failure. It used to be a bare `return`
 * with no toast — so the common case, an account created with no access,
 * looked on screen exactly like nothing happening at all.
 */
export const useAccessSave = () => {
  const ctx = useOrganizationCtx();

  return useCallback(
    async (
      userid: number,
      sets: AccessSets,
      changed: ChangedLists = ALL_CHANGED,
    ): Promise<AccessOutcome> => {
      const saved: AccessStep[] = [];
      const skipped: AccessStep[] = [];

      const stop = (failed: AccessStep, reason: string): AccessOutcome => ({
        ok: false,
        saved,
        skipped,
        failed,
        reason,
      });

      const steps: {
        step: AccessStep;
        run: () => Promise<{ data: { error: number; msg?: string } }>;
      }[] = [
        {
          step: "companies",
          run: () =>
            assignUserToCompany(ctx.url, ctx.token, userid, sets.companyIds),
        },
        {
          step: "baseGroups",
          run: () =>
            assignBaseGroupToUser(ctx.url, ctx.token, userid, sets.baseGroupIds),
        },
        {
          step: "stores",
          run: () => assignUserToStore(ctx.url, ctx.token, userid, sets.storeIds),
        },
      ];

      for (const { step, run } of steps) {
        if (!changed[step]) {
          skipped.push(step);
          continue;
        }
        try {
          const resp = await run();
          if (resp.data.error !== 0) {
            return stop(
              step,
              resp.data.msg ?? `${STEP_LABEL[step]} were refused by the server.`,
            );
          }
          saved.push(step);
        } catch (err) {
          return stop(step, (err as JsonError).message);
        }
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
  const stopped = outcome.failed ? STEP_LABEL[outcome.failed].toLowerCase() : "";
  if (done.length === 0) return `No access saved — ${stopped} failed first.`;
  return `${done.join(" and ")} saved. ${stopped} did not.`;
};
