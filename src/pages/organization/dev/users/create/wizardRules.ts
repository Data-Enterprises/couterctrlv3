import type { DuplicateSource } from "../../../../../features/dev/devUsersSlice";
import type { AccessPicks } from "../access/accessSets";
import { STEP_ORDER, type WizardStep } from "./wizardSteps";

/**
 * The wizard's rules, as plain functions: which steps are ready, how far the
 * step bar may jump, and why Create is off. Kept out of the component so they
 * can be read and tested on their own.
 */

export type StepReadiness = Record<WizardStep, boolean>;

export const readiness = ({
  identity,
  switching,
  hasAccess,
  emptyGroups,
}: {
  /** User info is complete, as the fields report it. */
  identity: boolean;
  /** The access type is still being switched. */
  switching: boolean;
  /** Any company or group would be written. */
  hasAccess: boolean;
  /** Groups held By store with nothing picked. */
  emptyGroups: number;
}): StepReadiness => {
  const assignments = hasAccess && emptyGroups === 0;
  return {
    identity,
    type: !switching,
    assignments,
    // Review is ready only when everything it reviews is. It used to be
    // `true`, so the step bar could reach it past a step that had been
    // emptied, and Create user made somebody with no access.
    review: identity && !switching && assignments,
  };
};

/**
 * The furthest step the step bar may jump to: up to and including the first
 * step that isn't ready. Going back to fix a step is always possible;
 * skipping past it is not.
 */
export const reachableLimit = (ready: StepReadiness): number => {
  const firstNotReady = STEP_ORDER.findIndex(
    (s) => s !== "review" && !ready[s],
  );
  return firstNotReady === -1 ? STEP_ORDER.length - 1 : firstNotReady;
};

/** Why Create user is off, in the words under the button; null when it isn't. */
export const createBlockReason = (
  ready: StepReadiness,
  { hasAccess }: { hasAccess: boolean },
): string | null => {
  if (!ready.identity) return "Finish User info first.";
  if (!ready.type) return "Wait for the access type to finish switching.";
  if (!ready.assignments) {
    return hasAccess
      ? "A group on Assignments has no stores picked."
      : "Give them at least one company or group on Assignments.";
  }
  return null;
};

/**
 * Why Save changes is off in Edit, or null when it can save.
 *
 * Each half of an Edit answers for itself: a details-only change needs only
 * valid details, and an access change needs Assignments ready. Save used to
 * need both whatever had changed, so someone with no company or group could
 * not have their name or email fixed, and the button was just grey.
 */
export const editBlockReason = ({
  ready,
  identityDirty,
  accessDirty,
  hasAccess,
  held = "loaded",
}: {
  ready: StepReadiness;
  identityDirty: boolean;
  accessDirty: boolean;
  hasAccess: boolean;
  /** Whether what the person holds has been read. A save from a screen
   *  missing some of it would act on what isn't there. */
  held?: "loaded" | "loading" | "failed";
}): string | null => {
  if (held === "loading") return "Still reading what they hold.";
  if (held === "failed") return "What they hold didn't load. Retry above.";
  if (!ready.type) return "Wait for the access type to finish switching.";
  if (!identityDirty && !accessDirty) return "Nothing has changed yet.";
  if (identityDirty && !ready.identity) return "Finish User info first.";
  if (accessDirty && !ready.assignments) {
    return hasAccess
      ? "A group on Assignments has no stores picked."
      : "Give them at least one company or group on Assignments.";
  }
  return null;
};

/**
 * The companies a duplicate starts with: every company the source holds, then
 * any its groups imply. Companies used to come from the groups alone, so a
 * company the source held with no group in it didn't carry over.
 */
export const duplicateCompanies = (source: DuplicateSource): number[] =>
  Array.from(
    new Set([...source.companyIds, ...source.groups.map((g) => g.company)]),
  );

/** Single Store holds one store, By store. */
export const trimToSingleStore = (picks: AccessPicks): AccessPicks => ({
  ...picks,
  mode: "selected",
  stores: picks.stores.slice(0, 1),
});

/** Whether Single Store would change these picks at all. */
export const needsSingleStoreTrim = (picks: AccessPicks): boolean =>
  !(picks.mode === "selected" && picks.stores.length <= 1);

/**
 * What choosing Single Store did to the picks, said on screen. Changing the
 * role back puts the picks back, so the note says that too.
 */
export const singleStoreNote = (
  before: AccessPicks,
  after: AccessPicks,
): string => {
  const kept = after.stores[0];
  const back = "Change the role back to restore them.";
  if (before.mode === "all") {
    return kept
      ? `Single Store holds one store By store, so only ${kept.store_number} · ${kept.store_name} is kept and their groups are no longer granted By group. ${back}`
      : `Single Store holds one store By store, so their groups are no longer granted By group and no store is picked yet. Pick one on Assignments. ${back}`;
  }
  const dropped = before.stores.length - after.stores.length;
  return `Single Store keeps only ${kept.store_number} · ${kept.store_name}; the other ${dropped} store${dropped === 1 ? "" : "s"} ${dropped === 1 ? "is" : "are"} unpicked. ${back}`;
};

/**
 * The password rules User info lists, as one list for the form and for the
 * check. They were only displayed: "a" was accepted (the backend's
 * create_user doesn't enforce them either; that half is yours).
 */
export const passwordRules = (pw: string) => [
  { met: pw.length >= 12, label: "At least 12 characters" },
  { met: /[a-z]/.test(pw) && /[A-Z]/.test(pw), label: "Upper and lower case" },
  { met: /[0-9]/.test(pw), label: "At least one number" },
  { met: /[^A-Za-z0-9]/.test(pw), label: "At least one symbol" },
];

export const passwordOk = (pw: string) => passwordRules(pw).every((r) => r.met);

/** The availability check's own words, as the slice holds them. */
export const NOT_AVAILABLE = "- Not available";
