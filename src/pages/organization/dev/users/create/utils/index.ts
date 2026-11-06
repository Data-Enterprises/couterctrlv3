// Interfaces
import type { WizardStep } from "../interfaces";

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
