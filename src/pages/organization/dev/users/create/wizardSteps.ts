/** The wizard's steps, in order. Kept out of `Stepper.tsx` so that file only
 *  exports a component — fast refresh stops working for a module that mixes
 *  the two, and a stale step rail is a confusing thing to debug. */
export type WizardStep = "identity" | "type" | "assignments" | "review";

export const STEP_ORDER: WizardStep[] = [
  "identity",
  "type",
  "assignments",
  "review",
];

export const STEP_TITLE: Record<WizardStep, string> = {
  identity: "User info",
  type: "Access type",
  assignments: "Assignments",
  review: "Review",
};
