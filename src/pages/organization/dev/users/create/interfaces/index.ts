// Interfaces
import type { AccessPicks, CarriedAccess } from "../../interfaces";

/** The wizard's steps, in order. Outside `Stepper.tsx`, so that file only
 *  exports a component (fast refresh). */
export type WizardStep = "identity" | "type" | "assignments" | "review";

export type StepReadiness = Record<WizardStep, boolean>;

/** The stages of a save, in the order they have to be written. */
export type AccessStep = "companies" | "grants" | "revoke";

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

export interface ExistingAccess {
  /** What the panel may show and the editor may change. */
  picks: AccessPicks;
  /** What the panel cannot show or does not own, kept out of its reach. */
  carried: CarriedAccess;
}

/** The four reads, by what the person holds that each one answers. */
export type HeldRead = "groups" | "stores" | "picks" | "companies";
